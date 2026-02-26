import type { NextApiRequest, NextApiResponse } from 'next'

// This is a mock API route - in production, you'd connect to your database
// and actual LLM/CrewAI services
// 
// For CrewAI integration, you would:
// 1. Call your Python CrewAI service (running on separate port, e.g., http://localhost:8000)
// 2. Pass the agent's Q&A pairs and user message
// 3. Receive intent, matched Q&A, and response

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const { message, responseMode, qaPairs, intentConfidence } = req.body

  if (!message || !id) {
    return res.status(400).json({ error: 'Message and agent ID are required' })
  }

  try {
    const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8000'

    // ALWAYS Try Python RAG service as the primary "Brain"
    try {
      const { message, responseMode, qaPairs, intentConfidence, history } = req.body;

      const ragResponse = await fetch(`${crewaiServiceUrl}/chat-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          agent_id: id,
          qa_pairs: qaPairs || [],
          // Roadmap: Standardize confidence logic (> 0.45)
          confidence_threshold: Math.max(intentConfidence > 1 ? intentConfidence / 100 : intentConfidence, 0.45),
          history: history || [],
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
