import type { NextApiRequest, NextApiResponse } from 'next'
import { generateQAPairsFromContent } from '@/lib/scraper'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8016'

  // --- HANDLE STATUS POLLING (GET) ---
  if (req.method === 'GET') {
    const { taskId } = req.query
    if (!taskId) return res.status(400).json({ error: 'taskId is required for polling' })

    try {
      const statusRes = await fetch(`${crewaiServiceUrl}/scrape-status/${taskId}`, {
        signal: AbortSignal.timeout(10000) // Status check should be fast
      })
      
      if (!statusRes.ok) {
        return res.status(statusRes.status).json({ error: 'Failed to fetch status from backend' })
      }

      const taskData = await statusRes.json()

      // If completed, transform the data to the format the UI expects
      if (taskData.status === 'completed' && taskData.data) {
        const scrapeData = taskData.data
        
        // Transform headings from Python format (level: "h1") to TypeScript format (level: 1)
        const transformedHeadings = (scrapeData.headings || []).map((heading: any) => {
          if (typeof heading === 'object' && heading !== null) {
            if (typeof heading.level === 'string' && heading.level.startsWith('h')) {
              const levelNum = parseInt(heading.level.substring(1)) || 1
              return { level: levelNum, text: heading.text || '', id: heading.id }
            }
            return { level: heading.level || 1, text: heading.text || '', id: heading.id }
          }
          return heading
        }).filter((h: any) => h && h.text && h.text.trim().length > 0)

        const scrapedContent = {
          title: scrapeData.title || 'Scraped Website',
          content: scrapeData.content || '',
          url: scrapeData.url,
          headings: transformedHeadings,
        }

        // Keep local Q&A generation for consistency with existing logic
        const qaPairs = generateQAPairsFromContent(scrapedContent as any, {
          maxPairs: 50,
          minAnswerLength: 20,
        })

        // Add transformed data to the response
        taskData.data.transformed = {
          ...scrapeData,
          headings: transformedHeadings,
          qaPairs: qaPairs,
        }
      }

      return res.status(200).json(taskData)
    } catch (err: any) {
      return res.status(500).json({ error: 'Polling error', message: err.message })
    }
  }

  // --- HANDLE START SCRAPE (POST) ---
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const { url, options } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  // Allow 'new' as agent ID for agent creation flow
  if (!id || (id !== 'new' && typeof id !== 'string')) {
    return res.status(400).json({ error: 'Valid agent ID is required' })
  }

  let validUrl = url.trim()
  if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
    validUrl = `https://${validUrl}`
  }

  try {
    // === HEALTH CHECK ===
    try {
      const healthRes = await fetch(`${crewaiServiceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      if (!healthRes.ok) throw new Error('unhealthy')
    } catch {
      return res.status(503).json({
        error: 'AI backend service is currently offline.',
        message: 'The AI service is not running or busy. Please try again in 30 seconds.',
        code: 'SERVICE_OFFLINE',
      })
    }

    // Call Python scraping service (Async start)
    console.log(`🌐 Initiating Async Scrape for: ${validUrl}`)
    const tempAgentId = `temp-${Buffer.from(validUrl).toString('base64').slice(0, 20)}-${Date.now()}`

    const scrapeResponse = await fetch(`${crewaiServiceUrl}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: validUrl,
        agent_id: tempAgentId,
        max_pages: options?.maxPages || 100,
        max_depth: options?.maxDepth || 5,
        persona_type: options?.personaType || "general",
      }),
    })

    if (!scrapeResponse.ok) {
      const errorData = await scrapeResponse.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `Backend error: ${scrapeResponse.statusText}`)
    }

    const startData = await scrapeResponse.json()
    
    // Return the task ID for the frontend to poll
    return res.status(200).json({
      success: true,
      async: true,
      taskId: startData.task_id,
      tempAgentId: tempAgentId,
      status: 'processing'
    })

  } catch (error: any) {
    console.error('Async Scrape Start Error:', error)
    return res.status(500).json({
      error: 'Failed to start scraping',
      message: error.message || 'Unknown error occurred'
    })
  }
}
