import { JSDOM } from 'jsdom'
import TurndownService from 'turndown'

// Type definitions for TurndownService
declare module 'turndown' {
  export default class TurndownService {
    constructor(options?: any)
    turndown(html: string): string
    addRule(key: string, rule: any): this
    use(plugin: any): this
  }
}

export interface ScrapedContent {
  title: string
  content: string
  html: string
  url: string
  headings: Array<{ level: number; text: string; id?: string }>
  metadata: {
    description?: string
    keywords?: string
    author?: string
  }
}

export interface QAPair {
  id: string
  question: string
  answer: string
  intent?: string
}

/**
 * Scrape content from a URL
 */
export async function scrapeURL(url: string): Promise<ScrapedContent> {
  try {
    // Validate URL
    const validUrl = url.startsWith('http') ? url : `https://${url}`
    const urlObj = new URL(validUrl)

    // Fetch the HTML content
    const response = await fetch(validUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      // Timeout after 10 minutes
      signal: AbortSignal.timeout(600000),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    
    // Create a virtual console to suppress CSS parsing errors
    const { VirtualConsole } = require('jsdom')
    const virtualConsole = new VirtualConsole()
    
    // Suppress CSS parsing errors (they're warnings, not fatal)
    virtualConsole.on('error', (error: any) => {
      // Only suppress CSS-related errors
      if (error && error.message && error.message.includes('CSS')) {
        // Silently ignore CSS parsing errors
        return
      }
      // Log other errors
      console.warn('JSDOM warning:', error.message)
    })
    
    // Parse HTML with JSDOM - wrap in try-catch for safety
    let dom: any
    let document: Document
    
    try {
      dom = new JSDOM(html, {
        runScripts: 'outside-only',
        resources: 'usable',
        virtualConsole: virtualConsole,
        pretendToBeVisual: false,
        // Don't load external resources
        url: validUrl,
      })
      document = dom.window.document
    } catch (parseError: any) {
      // If JSDOM fails, try a simpler parse
      console.warn('JSDOM parse error, trying simpler parse:', parseError.message)
      dom = new JSDOM(html, {
        runScripts: 'outside-only',
        virtualConsole: virtualConsole,
      })
      document = dom.window.document
    }

    // Extract title
    const title = document.querySelector('title')?.textContent?.trim() || 
                  document.querySelector('h1')?.textContent?.trim() || 
                  urlObj.hostname

    // Extract metadata
    const description = (document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                       document.querySelector('meta[property="og:description"]')?.getAttribute('content')) ?? undefined
    
    const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') ?? undefined
    const author = document.querySelector('meta[name="author"]')?.getAttribute('content') ?? undefined

    // Remove unwanted elements - safely handle errors
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 
      'aside', '.advertisement', '.ads', '[class*="ad"]',
      '.social', '.share', '.comments', '.sidebar',
      'iframe', 'noscript', '[role="banner"]', '[role="navigation"]',
      '[role="complementary"]', '.cookie', '.popup', '.modal',
      '[class*="menu"]', '[class*="navigation"]', '[id*="menu"]',
      '[id*="nav"]', '.skip-link', '.accessibility'
    ]
    
    try {
      unwantedSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => {
            try {
              el.remove()
            } catch (e) {
              // Ignore removal errors
            }
          })
        } catch (e) {
          // Ignore selector errors
        }
      })
    } catch (error) {
      // Continue even if removal fails
      console.warn('Could not remove some unwanted elements:', error)
    }

    // Extract main content - try multiple strategies
    let mainContent = document.querySelector('main') ||
                       document.querySelector('article') ||
                       document.querySelector('[role="main"]') ||
                       document.querySelector('.content') ||
                       document.querySelector('#content') ||
                       document.querySelector('.main') ||
                       document.querySelector('.post-content') ||
                       document.querySelector('.entry-content') ||
                       document.querySelector('.page-content') ||
                       document.querySelector('.article-content') ||
                       document.querySelector('.post-body') ||
                       document.querySelector('.entry-body') ||
                       document.querySelector('[class*="content"]') ||
                       document.querySelector('[id*="content"]')
    
    // If no main content found, try to find the largest content block
    if (!mainContent && document.body) {
      const allDivs = Array.from(document.body.querySelectorAll('div'))
      let largestDiv: Element | null = null
      let maxTextLength = 0
      
      allDivs.forEach(div => {
        const textLength = div.textContent?.trim().length || 0
        if (textLength > maxTextLength && textLength > 200) {
          maxTextLength = textLength
          largestDiv = div
        }
      })
      
      if (largestDiv) {
        mainContent = largestDiv
      } else {
        mainContent = document.body
      }
    }
    
    // Ensure mainContent is not null - if still null, create a wrapper
    if (!mainContent) {
      // Last resort: use document.documentElement
      mainContent = document.documentElement || document.body
    }
    
    // Final safety check
    if (!mainContent) {
      throw new Error('Could not find any content in the page')
    }

    // Extract headings - safely handle null case
    const headings: Array<{ level: number; text: string; id?: string }> = []
    try {
      const headingElements = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6')
    
      headingElements.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1))
        const text = heading.textContent?.trim() || ''
        if (text) {
          headings.push({
            level,
            text,
            id: heading.id || undefined
          })
        }
      })
    } catch (error) {
      // If heading extraction fails, continue without headings
      console.warn('Could not extract headings:', error)
    }

    // Convert HTML to Markdown for cleaner text with better formatting
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
      strongDelimiter: '**',
    })
    
    // Add custom rules for better content extraction
    turndownService.addRule('preserveLists', {
      filter: ['ul', 'ol'],
      replacement: (content: string, node: any) => {
        return '\n' + content + '\n'
      }
    })
    
    turndownService.addRule('preserveParagraphs', {
      filter: 'p',
      replacement: (content: string) => {
        return content.trim() ? '\n\n' + content.trim() + '\n\n' : ''
      }
    })
    
    // Get text content safely
    let textContent = ''
    let markdown = ''
    
    try {
      textContent = mainContent.textContent?.trim() || ''
      
      // Convert to markdown - safely handle innerHTML
      const innerHTML = mainContent.innerHTML || ''
      if (innerHTML) {
        markdown = turndownService.turndown(innerHTML)
        // Clean up excessive newlines
        markdown = markdown.replace(/\n{3,}/g, '\n\n').trim()
      }
    } catch (error) {
      // If markdown conversion fails, use text content
      console.warn('Markdown conversion failed, using text content:', error)
      textContent = mainContent.textContent?.trim() || ''
      markdown = textContent
    }

    return {
      title,
      content: markdown || textContent,
      html: mainContent.innerHTML,
      url: validUrl,
      headings,
      metadata: {
        description,
        keywords,
        author,
      }
    }
  } catch (error: any) {
    throw new Error(`Scraping failed: ${error.message}`)
  }
}

/**
 * Generate Q&A pairs from scraped content
 */
export function generateQAPairsFromContent(
  content: ScrapedContent,
  options: {
    maxPairs?: number
    minAnswerLength?: number
  } = {}
): QAPair[] {
  const { maxPairs = 50, minAnswerLength = 20 } = options
  const qaPairs: QAPair[] = []

  // Strategy 1: Generate Q&A from headings (improved with better content extraction)
  if (content.headings.length > 0) {
    const sections = splitContentByHeadings(content.content, content.headings)
    
    content.headings.forEach((heading, index) => {
      if (qaPairs.length >= maxPairs) return

      // Get section content - try current section, then next, then combine
      let sectionContent = sections[index] || ''
      
      // If current section is too short, try to get more content
      if (sectionContent.length < minAnswerLength && index < sections.length - 1) {
        sectionContent = (sectionContent + '\n\n' + sections[index + 1]).trim()
      }
      
      // If still short, look for content after the heading in the full content
      if (sectionContent.length < minAnswerLength) {
        const headingIndex = content.content.indexOf(heading.text)
        if (headingIndex !== -1) {
          const afterHeading = content.content.substring(headingIndex + heading.text.length)
          const nextHeadingIndex = index < content.headings.length - 1 
            ? content.content.indexOf(content.headings[index + 1].text, headingIndex)
            : -1
          
          const extractedContent = nextHeadingIndex !== -1
            ? afterHeading.substring(0, nextHeadingIndex - headingIndex - heading.text.length)
            : afterHeading.substring(0, 1000)
          
          if (extractedContent.trim().length > sectionContent.length) {
            sectionContent = extractedContent.trim()
          }
        }
      }
      
      if (sectionContent.length < minAnswerLength) return

      // Generate question from heading
      const question = headingToQuestion(heading.text)
      
      // Clean and format answer - preserve important structure
      let answer = sectionContent
        .replace(/^#{1,6}\s+/gm, '') // Remove markdown heading markers
        .replace(/\n{3,}/g, '\n\n') // Clean excessive newlines
        .trim()
      
      // Limit answer length but try to end at sentence boundary
      if (answer.length > 800) {
        const truncated = answer.substring(0, 800)
        const lastPeriod = truncated.lastIndexOf('.')
        const lastQuestion = truncated.lastIndexOf('?')
        const lastExclamation = truncated.lastIndexOf('!')
        const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclamation)
        
        if (lastSentence > 400) {
          answer = truncated.substring(0, lastSentence + 1)
        } else {
          answer = truncated + '...'
        }
      }
      
      if (answer.length >= minAnswerLength) {
        qaPairs.push({
          id: `qa-${Date.now()}-${index}`,
          question,
          answer,
          intent: generateIntent(question)
        })
      }
    })
  }

  // Strategy 2: Extract FAQ patterns if headings are not enough
  if (qaPairs.length < 5 && content.content) {
    const faqPatterns = extractFAQPatterns(content.content)
    faqPatterns.forEach((faq, index) => {
      if (qaPairs.length >= maxPairs) return
      
      qaPairs.push({
        id: `qa-faq-${Date.now()}-${index}`,
        question: faq.question,
        answer: faq.answer,
        intent: generateIntent(faq.question)
      })
    })
  }

  // Strategy 3: Generate Q&A from paragraphs if still not enough
  if (qaPairs.length < maxPairs) {
    const paragraphs = content.content
      .split(/\n{2,}/) // Split on double newlines
      .filter(p => {
        const trimmed = p.trim()
        return trimmed.length > minAnswerLength && 
               !trimmed.match(/^#{1,6}\s/) && // Not a heading
               !trimmed.match(/^[-*]\s/) && // Not a list item
               trimmed.split(' ').length > 10 // Has enough words
      })
    
    const neededPairs = maxPairs - qaPairs.length
    paragraphs.slice(0, Math.min(neededPairs * 2, paragraphs.length)).forEach((paragraph, index) => {
      if (qaPairs.length >= maxPairs) return
      
      // Generate a question from the paragraph
      const question = generateQuestionFromParagraph(paragraph)
      
      // Use more context for answer (up to 600 chars)
      let answer = paragraph.substring(0, 600).trim()
      
      // Ensure answer ends at a sentence boundary
      if (answer.length === 600 && paragraph.length > 600) {
        const lastPeriod = answer.lastIndexOf('.')
        const lastQuestion = answer.lastIndexOf('?')
        const lastExclamation = answer.lastIndexOf('!')
        const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation)
        if (lastSentenceEnd > 300) {
          answer = answer.substring(0, lastSentenceEnd + 1)
        }
      }
      
      if (answer.length >= minAnswerLength) {
        qaPairs.push({
          id: `qa-para-${Date.now()}-${index}`,
          question,
          answer,
          intent: generateIntent(question)
        })
      }
    })
  }

  return qaPairs.slice(0, maxPairs)
}

/**
 * Split content by headings - improved version with better section mapping
 */
function splitContentByHeadings(content: string, headings: Array<{ level: number; text: string }>): string[] {
  const sections: string[] = []
  const lines = content.split('\n')
  let currentSection: string[] = []
  let headingIndex = 0
  let lastHeadingLevel = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    
    // Check if this line matches a heading (more flexible matching)
    let matchedHeading: { level: number; text: string } | null = null
    for (const heading of headings) {
      // Check for exact match or if line starts with heading text
      if (trimmedLine === heading.text || 
          trimmedLine.startsWith(heading.text) ||
          trimmedLine.includes(heading.text) ||
          (trimmedLine.startsWith('#') && trimmedLine.includes(heading.text))) {
        matchedHeading = heading
        break
      }
    }
    
    if (matchedHeading && headingIndex < headings.length) {
      // Save previous section if it has content
      if (currentSection.length > 0) {
        const sectionText = currentSection.join('\n').trim()
        if (sectionText.length > 0) {
          sections.push(sectionText)
        }
        currentSection = []
      }
      headingIndex++
      lastHeadingLevel = matchedHeading.level
      // Skip the heading line itself
      continue
    }
    
    // If we hit a higher level heading, start a new section
    if (trimmedLine.startsWith('#')) {
      const level = (trimmedLine.match(/^#+/)?.[0]?.length || 0)
      if (level > 0 && level <= lastHeadingLevel && currentSection.length > 0) {
        const sectionText = currentSection.join('\n').trim()
        if (sectionText.length > 0) {
          sections.push(sectionText)
        }
        currentSection = []
      }
    }
    
    currentSection.push(line)
  }
  
  // Add last section
  if (currentSection.length > 0) {
    const sectionText = currentSection.join('\n').trim()
    if (sectionText.length > 0) {
      sections.push(sectionText)
    }
  }

  // Ensure we have at least as many sections as headings
  while (sections.length < headings.length) {
    sections.push('')
  }

  return sections
}

/**
 * Convert heading to question - improved with better question generation
 */
function headingToQuestion(heading: string): string {
  let question = heading.trim()
  
  // If it's already a question, return it
  if (question.endsWith('?') && /^(what|who|when|where|why|how|is|are|do|does|can|could|will|would|should|may|might)/i.test(question)) {
    return question
  }

  // Remove common non-question prefixes
  question = question
    .replace(/^(about|introduction|overview|summary|details?|information|guide|tutorial|learn|get|start|begin)\s+/i, '')
    .trim()

  // Check if it already starts with a question word
  if (/^(what|who|when|where|why|how|is|are|do|does|can|could|will|would|should|may|might)/i.test(question)) {
    if (!question.endsWith('?')) {
      question += '?'
    }
    return question
  }

  // Infer question type based on content
  const lower = question.toLowerCase()
  
  if (lower.includes('how') || lower.includes('method') || lower.includes('process') || lower.includes('steps')) {
    question = `How ${question}?`
  } else if (lower.includes('what') || lower.includes('definition') || lower.includes('meaning')) {
    question = `What is ${question}?`
  } else if (lower.includes('who') || lower.includes('person') || lower.includes('team')) {
    question = `Who ${question}?`
  } else if (lower.includes('when') || lower.includes('time') || lower.includes('date') || lower.includes('schedule')) {
    question = `When ${question}?`
  } else if (lower.includes('where') || lower.includes('location') || lower.includes('place')) {
    question = `Where ${question}?`
  } else if (lower.includes('why') || lower.includes('reason') || lower.includes('purpose')) {
    question = `Why ${question}?`
  } else if (lower.includes('can') || lower.includes('able') || lower.includes('possible')) {
    question = `Can ${question}?`
  } else if (lower.startsWith('is ') || lower.startsWith('are ')) {
    question = question.charAt(0).toUpperCase() + question.slice(1)
    if (!question.endsWith('?')) {
      question += '?'
    }
  } else {
    // Default: convert to "What is..." question
    question = `What is ${question}?`
  }

  return question
}

/**
 * Extract FAQ patterns from content - enhanced with more patterns
 */
function extractFAQPatterns(content: string): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = []
  
  // Pattern 1: Q: ... A: ... or Q. ... A. ...
  const qaPattern1 = /(?:Q[:.]|Question[:.])\s*([^\n]+?)\s*(?:A[:.]|Answer[:.])\s*([^\n]+?)(?=(?:Q[:.]|Question[:.])|$)/gi
  let match
  while ((match = qaPattern1.exec(content)) !== null && faqs.length < 15) {
    const question = match[1].trim()
    const answer = match[2].trim()
    if (question.length > 5 && answer.length > 20) {
      faqs.push({ question, answer })
    }
  }

  // Pattern 2: **Question:** ... **Answer:** ... or ### Question
  const qaPattern2 = /(?:\*\*|###)\s*Question[:.]?\s*(?:\*\*)?\s*([^\n]+?)\s*(?:\*\*|###)\s*Answer[:.]?\s*(?:\*\*)?\s*([^\n]+?)(?=(?:\*\*|###)\s*Question|$)/gi
  while ((match = qaPattern2.exec(content)) !== null && faqs.length < 15) {
    const question = match[1].trim().replace(/\*\*/g, '')
    const answer = match[2].trim().replace(/\*\*/g, '')
    if (question.length > 5 && answer.length > 20) {
      faqs.push({ question, answer })
    }
  }

  // Pattern 3: <dt>Question</dt><dd>Answer</dd> (HTML definition lists)
  const qaPattern3 = /<dt[^>]*>([^<]+?)<\/dt>\s*<dd[^>]*>([^<]+?)<\/dd>/gi
  while ((match = qaPattern3.exec(content)) !== null && faqs.length < 15) {
    const question = match[1].replace(/<[^>]+>/g, '').trim()
    const answer = match[2].replace(/<[^>]+>/g, '').trim()
    if (question.length > 5 && answer.length > 20) {
      faqs.push({ question, answer })
    }
  }

  // Pattern 4: FAQ items in lists (e.g., - What is X? Y is...)
  const qaPattern4 = /[-*]\s*([^\n]+?\?)\s*([^\n]+?)(?=[-*]|$)/gi
  while ((match = qaPattern4.exec(content)) !== null && faqs.length < 15) {
    const question = match[1].trim()
    const answer = match[2].trim()
    if (question.endsWith('?') && answer.length > 20) {
      faqs.push({ question, answer })
    }
  }

  // Pattern 4: Lines starting with "Q" or "Question" followed by answer
  const lines = content.split('\n')
  for (let i = 0; i < lines.length - 1 && faqs.length < 15; i++) {
    const line = lines[i].trim()
    if ((line.match(/^(Q[:\\.]|Question[:\\.])/i) || line.match(/^#{1,3}\s*(Q[:\\.]|Question[:\\.])/i)) && 
        lines[i + 1] && lines[i + 1].trim().length > 20) {
      const question = line.replace(/^#{1,3}\s*/, '').replace(/^(Q[:\\.]|Question[:\\.])\s*/i, '').trim()
      let answer = ''
      let j = i + 1
      while (j < lines.length && j < i + 10) {
        const nextLine = lines[j].trim()
        if (nextLine.match(/^(A[:\\.]|Answer[:\\.])/i) || nextLine.match(/^#{1,3}\s*(Q[:\\.]|Question[:\\.])/i)) {
          break
        }
        if (nextLine.length > 0) {
          answer += (answer ? ' ' : '') + nextLine
        }
        j++
      }
      if (question.length > 5 && answer.length > 20) {
        faqs.push({ question, answer })
      }
    }
  }

  return faqs
}

/**
 * Generate question from paragraph - improved with better understanding
 */
function generateQuestionFromParagraph(paragraph: string): string {
  // Extract key phrases and sentences
  const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 10)
  if (sentences.length === 0) return 'What is this about?'

  const firstSentence = sentences[0].trim()
  const lower = firstSentence.toLowerCase()
  
  // Extract key nouns/subjects (simple heuristic)
  const extractKeyTerms = (text: string): string => {
    // Remove common words
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
                       'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
                       'this', 'that', 'these', 'those', 'it', 'they', 'we', 'you', 'our', 'your']
    const words = text.split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.includes(w.toLowerCase()))
      .slice(0, 5)
    return words.join(' ')
  }
  
  // Try to create a question from the first sentence
  if (firstSentence.length > 120) {
    // Too long, create a summary question from key terms
    const keyTerms = extractKeyTerms(firstSentence)
    if (keyTerms) {
      return `What is ${keyTerms}?`
    }
    const words = firstSentence.split(/\s+/).slice(0, 8).join(' ')
    return `What is ${words}?`
  }

  // Convert common statement patterns to questions
  if (lower.startsWith('this is') || lower.startsWith('this ')) {
    return firstSentence.replace(/^this (is )?/i, 'What is ') + '?'
  }
  
  if (lower.startsWith('we are') || lower.startsWith('we provide') || lower.startsWith('we offer')) {
    return firstSentence.replace(/^we (are|provide|offer)/i, 'What do you') + '?'
  }
  
  if (lower.startsWith('our') || lower.startsWith('the company')) {
    return firstSentence.replace(/^(our|the company)/i, 'What is your') + '?'
  }
  
  if (lower.startsWith('you can') || lower.startsWith('users can')) {
    return firstSentence.replace(/^(you|users) can/i, 'How can I') + '?'
  }
  
  if (lower.startsWith('it ') || lower.startsWith('this ')) {
    const keyTerms = extractKeyTerms(firstSentence)
    if (keyTerms) {
      return `What is ${keyTerms}?`
    }
  }

  // Default: create a question from key terms
  const keyTerms = extractKeyTerms(firstSentence)
  if (keyTerms && keyTerms.length > 5) {
    return `What is ${keyTerms}?`
  }

  return `What is ${firstSentence.substring(0, 60)}?`
}

/**
 * Generate intent from question
 */
function generateIntent(question: string): string {
  const lower = question.toLowerCase()
  
  if (lower.includes('hour') || lower.includes('open') || lower.includes('time') || lower.includes('when')) {
    return 'business_hours'
  }
  if (lower.includes('price') || lower.includes('cost') || lower.includes('fee') || lower.includes('pricing')) {
    return 'pricing'
  }
  if (lower.includes('support') || lower.includes('help') || lower.includes('assistance')) {
    return 'support'
  }
  if (lower.includes('refund') || lower.includes('return') || lower.includes('cancel')) {
    return 'refund'
  }
  if (lower.includes('contact') || lower.includes('email') || lower.includes('phone') || lower.includes('address')) {
    return 'contact'
  }
  if (lower.includes('location') || lower.includes('where') || lower.includes('address')) {
    return 'location'
  }
  if (lower.includes('who') || lower.includes('about') || lower.includes('company')) {
    return 'general'
  }
  
  return 'general'
}
