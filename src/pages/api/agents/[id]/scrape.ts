import type { NextApiRequest, NextApiResponse } from 'next'
import { generateQAPairsFromContent } from '@/lib/scraper'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  // Validate URL format (declare outside try-catch for fallback access)
  let validUrl = url.trim()
  if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
    validUrl = `https://${validUrl}`
  }

  try {
    const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8016'

    // === HEALTH CHECK: Ensure LLM backend is online before proceeding ===
    try {
      const healthRes = await fetch(`${crewaiServiceUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(4000) })
      if (!healthRes.ok) {
        throw new Error('unhealthy')
      }
    } catch {
      console.error('❌ CrewAI backend is offline — blocking scrape/agent creation')
      return res.status(503).json({
        error: 'AI backend service is currently offline.',
        message: 'The LLM/AI service is not running. Please start the backend service before creating an agent. Agent creation requires a live AI backend to process and learn from your content.',
        code: 'SERVICE_OFFLINE',
      })
    }

    // Call Python scraping service
    console.log(`🌐 Calling Python scraper service for: ${validUrl}`)
    
    // Generate temporary agent ID (hash of URL + timestamp for uniqueness)
    const tempAgentId = `temp-${Buffer.from(validUrl).toString('base64').slice(0, 20)}-${Date.now()}`
    
    const scrapeResponse = await fetch(`${crewaiServiceUrl}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: validUrl,
        agent_id: tempAgentId, // Save content with temporary ID
        max_pages: options?.maxPages || options?.max_pages || 100, // Increased default
        max_depth: options?.maxDepth || options?.max_depth || 5, // Increased default
        follow_external: options?.followExternal || options?.follow_external || false,
        respect_robots: options?.respectRobots !== false,
        delay: options?.delay || 0.3,
      }),
    })

    if (!scrapeResponse.ok) {
      const errorData = await scrapeResponse.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `Python service error: ${scrapeResponse.statusText}`)
    }

    const scrapeData = await scrapeResponse.json()
    
    console.log('📥 Python scraper response:', {
      success: scrapeData.success,
      hasData: !!scrapeData.data,
      dataKeys: scrapeData.data ? Object.keys(scrapeData.data) : [],
      contentLength: scrapeData.data?.content?.length || 0,
      headingsCount: scrapeData.data?.headings?.length || 0,
      pagesCount: scrapeData.data?.pages?.length || 0
    })
    
    if (!scrapeData.success || !scrapeData.data) {
      console.error('❌ Python scraper returned unsuccessful response:', scrapeData)
      throw new Error('Python scraper returned unsuccessful response')
    }

    // Check if content is empty
    if (!scrapeData.data.content || scrapeData.data.content.trim().length === 0) {
      console.warn('⚠️  Python scraper returned empty content')
      // Don't throw error, but log warning - might still have pages
    }

    // Convert Python response to TypeScript format for Q&A generation
    // Transform headings from Python format (level: "h1") to TypeScript format (level: 1)
    const transformedHeadings = (scrapeData.data.headings || []).map((heading: any) => {
      if (typeof heading === 'object' && heading !== null) {
        // Handle Python format: { level: "h1", text: "..." }
        if (typeof heading.level === 'string' && heading.level.startsWith('h')) {
          const levelNum = parseInt(heading.level.substring(1)) || 1
          return {
            level: levelNum,
            text: heading.text || heading.text || '',
            id: heading.id
          }
        }
        // Handle TypeScript format: { level: 1, text: "..." }
        return {
          level: heading.level || 1,
          text: heading.text || '',
          id: heading.id
        }
      }
      return heading
    }).filter((h: any) => h && h.text && h.text.trim().length > 0)

    const scrapedContent = {
      title: scrapeData.data.title || 'Scraped Website',
      content: scrapeData.data.content || '', // Full content - NO LIMITS!
      url: scrapeData.data.url,
      headings: transformedHeadings,
      metadata: scrapeData.data.metadata || {},
      html: '', // Not needed for Q&A generation
    }

    // Debug logging
    console.log(`📊 Scraped content stats:`, {
      title: scrapedContent.title,
      contentLength: scrapedContent.content.length,
      headingsCount: scrapedContent.headings.length,
      url: scrapedContent.url
    })

    // Generate Q&A pairs from content
    console.log(`🔄 Generating Q&A pairs from content (${scrapedContent.content.length} chars, ${scrapedContent.headings.length} headings)`)
    const qaPairs = generateQAPairsFromContent(scrapedContent, {
      maxPairs: options?.maxPairs || 50,
      minAnswerLength: options?.minAnswerLength || 20,
    })
    console.log(`✅ Generated ${qaPairs.length} Q&A pairs`)

    return res.status(200).json({
      success: true,
      data: {
        title: scrapedContent.title,
        content: scrapedContent.content, // Full content - NO CHARACTER LIMIT!
        url: scrapedContent.url,
        headings: scrapedContent.headings,
        metadata: scrapedContent.metadata,
        qaPairs: qaPairs, // Keep for backward compatibility
        tempAgentId: tempAgentId, // Return temp ID for content storage
        stats: {
          totalCharacters: scrapeData.data.stats?.totalCharacters || scrapedContent.content.length,
          headingsCount: scrapeData.data.stats?.headingsCount || scrapedContent.headings.length,
          qaPairsCount: qaPairs.length,
          totalPages: scrapeData.data.stats?.totalPages || 1,
          sitemapUrls: scrapeData.data.stats?.sitemapUrls || 0,
        },
        pages: scrapeData.data.pages || [],
      }
    })
  } catch (error: any) {
    console.error('Scraping error:', error)

    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed') || error.message?.includes('SERVICE_OFFLINE')) {
      return res.status(503).json({
        error: 'AI backend service is offline.',
        message: 'The LLM service is not running. Please start the Python backend before creating an agent.',
        code: 'SERVICE_OFFLINE',
      })
    }

    return res.status(500).json({
      error: 'Failed to scrape URL',
      message: error.message || 'Unknown error occurred'
    })
  }
}
