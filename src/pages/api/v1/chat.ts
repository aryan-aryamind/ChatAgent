import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKeyHeader = req.headers['x-api-key'] as string

  if (!apiKeyHeader) {
    return res.status(401).json({ error: 'API key is required in x-api-key header' })
  }

  try {
    // Hash the incoming key to compare with our database
    const keyHash = crypto.createHash('sha256').update(apiKeyHeader).digest('hex')

    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        agent: true,
        user: { select: { plan: true, role: true } }
      }
    })

    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Invalid API key' })
    }

    // 1. Check if the key has been disabled by an admin
    if (apiKeyRecord.status !== 'active') {
      return res.status(403).json({ 
        error: 'Key disabled by administrator',
        code: 'KEY_DISABLED' 
      })
    }

    // 2. Check Quotas for FREE plan users
    if (apiKeyRecord.user.plan === 'FREE' && apiKeyRecord.user.role !== 'ADMIN') {
      // Check Usage Count (1,000 requests limit)
      if (apiKeyRecord.usageCount >= 1000) {
        return res.status(403).json({ 
          error: 'Free usage limit (1,000 requests) exceeded. Please upgrade your plan.',
          code: 'QUOTA_EXCEEDED' 
        })
      }

      // Check Expiration (3 days from creation)
      const expirationDate = new Date(apiKeyRecord.createdAt)
      expirationDate.setDate(expirationDate.getDate() + 3)
      
      if (new Date() > expirationDate) {
        return res.status(403).json({ 
          error: 'Free trial (3 days) has expired. Please upgrade your plan.',
          code: 'TRIAL_EXPIRED' 
        })
      }
    }

    const { message, history } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' })
    }

    const agent = apiKeyRecord.agent

    // Update usage and last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { 
        lastUsed: new Date(),
        usageCount: { increment: 1 } 
      }
    })

    // Prepare conversation history
    const conversationHistory = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }))

    const systemPrompt = agent.initialMessage || `You are an AI assistant named ${agent.name}. Help the user with their questions.`

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[v1 API] Groq error:', errorData)
      return res.status(502).json({ error: 'AI service error' })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content

    return res.status(200).json({ 
      reply,
      agentName: agent.name,
      agentId: agent.id,
      usage: apiKeyRecord.user.plan === 'FREE' ? `${apiKeyRecord.usageCount + 1}/1000` : 'unlimited'
    })
  } catch (error) {
    console.error('[v1 API] Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
