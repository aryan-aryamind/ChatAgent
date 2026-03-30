import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10 // 10 requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now })
    return false
  }

  record.count++
  if (record.count > MAX_REQUESTS) {
    return true
  }
  return false
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const { message, responseMode, qaPairs, intentConfidence } = req.body

  if (!message || !id) {
    return res.status(400).json({ error: 'Message and agent ID are required' })
  }

  try {
    // Check agent status and expiration
    const agent = await prisma.agent.findUnique({
      where: { id: id as string },
    })

    if (!agent) {
      // For backward compatibility or if database is not yet populated
      console.warn(`[Chat] Agent ${id} not found in database. Proceeding with caution.`);
    } else {
      const agentData = agent as any;
      if (agentData.status === 'disabled' || agentData.status === 'hidden') {
        return res.status(403).json({
          text: "This agent is currently unavailable.",
          intent: 'agent_disabled',
          confidence: 0,
          sources: [],
        })
      }

      if (agentData.expiresAt && new Date() > new Date(agentData.expiresAt)) {
        return res.status(403).json({
          text: "This agent's time period has ended. It is no longer active.",
          intent: 'agent_expired',
          confidence: 0,
          sources: [],
        })
      }
    }

    const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8016'

    // ALWAYS Try Python RAG service as the primary "Brain"
    try {
      const { message, qaPairs, intentConfidence, history, system_prompt } = req.body;
      const safeIntentConfidence = intentConfidence !== undefined ? (intentConfidence > 1 ? intentConfidence / 100 : intentConfidence) : 0.8;

      const ragResponse = await fetch(`${crewaiServiceUrl}/chat-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          agent_id: id,
          qa_pairs: qaPairs || [],
          confidence_threshold: Math.max(safeIntentConfidence, 0.45),
          history: history || [],
          system_prompt: system_prompt,
          company_name: agent?.name,
        }),
      })

      if (ragResponse.ok) {
        const ragData = await ragResponse.json()

        // High-quality RAG or FAQ response (Standardized Confidence logic)
        if (ragData.confidence > 45) {
          return res.status(200).json({
            text: ragData.text,
            intent: ragData.intent || 'content_based',
            confidence: ragData.confidence || 0,
            matchedQAPair: null,
            sources: ragData.sources || [],
            responseTime: 0.5,
          })
        }
      }

      // If RAG responded but with low confidence/no match
      return res.status(200).json({
        text: "I don't have that information in my knowledge base. Please try asking something else.",
        intent: 'no_match',
        confidence: 0,
        sources: [],
        matchedQAPair: null,
      })

    } catch (serviceError: any) {
      if (serviceError.code === 'ECONNREFUSED' || serviceError.message?.includes('fetch failed')) {
        console.warn(`[Service] CrewAI background service is offline at ${crewaiServiceUrl}`);
        return res.status(200).json({
          text: "I am out of service. Please try again later.",
          intent: 'service_offline',
          confidence: 0,
          sources: [],
        })
      }
      throw serviceError;
    }
  } catch (error) {
    console.error('Error processing chat:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
