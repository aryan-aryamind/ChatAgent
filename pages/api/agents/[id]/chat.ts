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
    // In a real app, you'd fetch the agent from your database
    // For now, we'll simulate based on responseMode
    
    if (responseMode === 'crewai') {
      // Try to call Python CrewAI service first (for semantic similarity)
      try {
        const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8000'
        
        // Try RAG-based chat-content endpoint first (better for scraped content)
        try {
          const ragResponse = await fetch(`${crewaiServiceUrl}/chat-content`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: message,
              agent_id: id,  // Use agent ID for RAG lookup
              confidence_threshold: Math.max(
                intentConfidence > 1 ? intentConfidence / 100 : intentConfidence,
                0.2
              ),
            }),
          })
          
          if (ragResponse.ok) {
            const ragData = await ragResponse.json()
            // RAG endpoint returns different format, adapt it
            return res.status(200).json({
              text: ragData.text,
              intent: ragData.intent || 'general',
              confidence: ragData.confidence || 0,
              matchedQAPair: ragData.sources && ragData.sources.length > 0 ? {
                question: message,
                answer: ragData.text,
              } : null,
              sources: ragData.sources || [],
              responseTime: 0.5,
            })
          }
        } catch (ragError) {
          console.warn('RAG endpoint not available, falling back to Q&A mode:', ragError)
        }
        
        // Fallback to Q&A-based chat endpoint
        const crewaiResponse = await fetch(`${crewaiServiceUrl}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            qa_pairs: (qaPairs || []).map((qa: any) => ({
              id: qa.id || Date.now().toString(),
              question: qa.question,
              answer: qa.answer,
              intent: qa.intent,
            })),
            confidence_threshold: Math.max(
              intentConfidence > 1 ? intentConfidence / 100 : intentConfidence,
              0.2  // Minimum threshold of 20% to catch more matches and be more conversational
            ),
          }),
        })

        if (crewaiResponse.ok) {
          const data = await crewaiResponse.json()
          return res.status(200).json({
            text: data.text,
            intent: data.intent,
            confidence: data.confidence,
            matchedQAPair: data.matched_qa_pair ? {
              question: data.matched_qa_pair.question,
              answer: data.matched_qa_pair.answer,
            } : null,
            sources: data.matched_qa_pair ? ['Q&A Pair'] : [],
            responseTime: 0.5,
          })
        } else {
          // If Python service fails, fallback to improved matching
          console.warn('Python CrewAI service unavailable, using fallback matching')
        }
      } catch (error) {
        // If Python service is not running, fallback to improved matching
        console.warn('Python CrewAI service not available, using fallback:', error)
        console.log('Q&A Pairs received:', qaPairs?.length || 0)
        console.log('Intent Confidence threshold:', intentConfidence)
      }
      
      // Fallback to improved matching with synonym support
      const crewaiResponse = await simulateCrewAIResponse(
        message, 
        qaPairs || [], 
        intentConfidence || 0.8
      )
      return res.status(200).json(crewaiResponse)
    } else {
      // Simulate LLM response
      // In production, this would call OpenAI/Anthropic/etc.
      const llmResponse = await simulateLLMResponse(message)
      return res.status(200).json(llmResponse)
    }
  } catch (error) {
    console.error('Error processing chat:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Simulate CrewAI response
async function simulateCrewAIResponse(
  message: string, 
  qaPairs: Array<{ question: string; answer: string; intent?: string }> = [],
  intentConfidence: number = 0.8
) {
  const lowerMessage = message.toLowerCase().trim()
  
  let intent = 'general'
  let confidence = 0.0
  let matchedQAPair = null
  let answer = 'I don\'t have information about that in this Agent yet. Please ask something related to its configured questions.'

  // Detect general conversation and greetings first
  const greetings = ['hey', 'hi', 'hello', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy', 'sup', 'what\'s up']
  const casualConversation = ['how are you', 'how\'s it going', 'what\'s going on', 'how do you do', 'nice to meet you', 'thanks', 'thank you', 'bye', 'goodbye', 'see you']
  const questionWords = ['what', 'when', 'where', 'who', 'why', 'how', 'which', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does', 'did']
  
  const isGreeting = greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + ' ') || lowerMessage.endsWith(' ' + g))
  const isCasual = casualConversation.some(c => lowerMessage.includes(c))
  const hasQuestion = questionWords.some(q => lowerMessage.includes(' ' + q + ' ') || lowerMessage.startsWith(q + ' ') || lowerMessage.endsWith(' ' + q))
  
  // Track if we should use greeting response (only if no question detected)
  let useGreetingResponse = false
  let greetingIntent = ''
  
  // If it's a pure greeting or casual conversation without a question, prepare friendly response
  // Include available topics to help users understand what they can ask
  if ((isGreeting || isCasual) && !hasQuestion) {
    useGreetingResponse = true
    
    // Get available topics from Q&A pairs to show users what they can ask
    const availableTopics = qaPairs && qaPairs.length > 0 
      ? qaPairs.slice(0, 5).map(qa => qa.question)
      : []
    
    let greetingBase = ""
    if (isGreeting) {
      const greetingOptions = [
        "Hello! I'm here to help you.",
        "Hi there! I'm your AI assistant.",
        "Hello! Welcome!",
        "Hi! Great to see you!"
      ]
      greetingBase = greetingOptions[Math.floor(Math.random() * greetingOptions.length)]
      greetingIntent = 'greeting'
    } else if (isCasual) {
      const casualOptions = [
        "I'm doing well, thank you!",
        "I'm here and ready to help!",
        "Thanks for chatting!",
        "You're welcome!"
      ]
      greetingBase = casualOptions[Math.floor(Math.random() * casualOptions.length)]
      greetingIntent = 'casual'
    }
    
    // Simple greeting response without listing topics
    answer = greetingBase
  }

  // If we have Q&A pairs, try to match against them
  if (qaPairs && qaPairs.length > 0) {
    console.log(`[Fallback] Matching against ${qaPairs.length} Q&A pairs for message: "${message}"`)
    let bestMatch = null
    let bestScore = 0

    for (const qaPair of qaPairs) {
      const questionLower = qaPair.question.toLowerCase().trim()
      
      // 1. Exact match (highest priority)
      if (lowerMessage === questionLower) {
        bestMatch = qaPair
        bestScore = 1.0
        break
      }
      
      // 2. Substring match - check if question is contained in message or vice versa
      if (lowerMessage.includes(questionLower) || questionLower.includes(lowerMessage)) {
        const substringScore = Math.min(
          lowerMessage.length / questionLower.length,
          questionLower.length / lowerMessage.length
        )
        // Boost substring matches - they're usually very relevant
        const boostedScore = Math.min(substringScore * 1.2, 0.95)
        if (boostedScore > bestScore) {
          bestScore = boostedScore
          bestMatch = qaPair
        }
        continue
      }
      
      // 2.25. Check for variations like "what is your company do" matching "what is your company"
      // Remove common verbs at the end that don't change meaning
      const messageWithoutEndVerbs = lowerMessage.replace(/\s+(do|does|doing|work|works|operate|operates|function|functions)$/i, '').trim()
      const questionWithoutEndVerbs = questionLower.replace(/\s+(do|does|doing|work|works|operate|operates|function|functions)$/i, '').trim()
      if (messageWithoutEndVerbs === questionWithoutEndVerbs || 
          messageWithoutEndVerbs.includes(questionWithoutEndVerbs) || 
          questionWithoutEndVerbs.includes(messageWithoutEndVerbs)) {
        const variationScore = 0.85
        if (variationScore > bestScore) {
          bestScore = variationScore
          bestMatch = qaPair
        }
        continue
      }
      
      // 2.5. Check if key words from question appear in message (more lenient)
      const questionKeyWords = questionLower.split(/\s+/).filter(w => w.length > 2)
      const messageKeyWords = lowerMessage.split(/\s+/).filter(w => w.length > 2)
      const matchingKeyWords = questionKeyWords.filter(qw => 
        messageKeyWords.some(mw => mw.includes(qw) || qw.includes(mw))
      )
      if (matchingKeyWords.length >= Math.min(2, questionKeyWords.length)) {
        const keyWordScore = matchingKeyWords.length / Math.max(questionKeyWords.length, 1)
        if (keyWordScore > bestScore) {
          bestScore = keyWordScore
          bestMatch = qaPair
        }
        continue
      }
      
      // 3. Word-based matching with synonym support
      const questionWords = questionLower.split(/\s+/).filter(w => w.length > 1)
      const messageWords = lowerMessage.split(/\s+/).filter(w => w.length > 1)
      
      if (questionWords.length === 0) continue
      
      // Synonym mapping for common terms (helps match "office time" with "business hours")
      const synonyms: Record<string, string[]> = {
        'hours': ['time', 'timing', 'schedule', 'when', 'timings'],
        'business': ['office', 'company', 'work', 'working', 'workplace', 'organization', 'firm', 'corporation', 'enterprise'],
        'company': ['business', 'office', 'organization', 'firm', 'corporation', 'enterprise', 'workplace'],
        'location': ['where', 'place', 'address', 'located', 'position', 'site', 'venue'],
        'price': ['cost', 'fee', 'pricing', 'charge', 'amount', 'rate', 'costs', 'fees'],
        'support': ['help', 'assistance', 'aid', 'service', 'helping'],
        'open': ['available', 'operating', 'running', 'active'],
        'time': ['hours', 'timing', 'schedule', 'when'],
        'office': ['business', 'company', 'workplace'],
        'target': ['audience', 'market', 'customers', 'clients', 'users'],
        'market': ['target', 'audience', 'customers', 'clients', 'users'],
        'technology': ['tech', 'system', 'platform', 'solution', 'software'],
        'do': ['does', 'doing', 'work', 'operate', 'function'],
        'does': ['do', 'doing', 'work', 'operate', 'function'],
        'doing': ['do', 'does', 'work', 'operate', 'function'],
      }
      
      // Expand words with synonyms
      const expandWithSynonyms = (words: string[]): Set<string> => {
        const expanded = new Set(words)
        for (const word of words) {
          // Add the word itself
          expanded.add(word)
          
          // Check if word matches any synonym key
          for (const [key, syns] of Object.entries(synonyms)) {
            if (word.includes(key) || key.includes(word)) {
              syns.forEach(syn => expanded.add(syn))
              expanded.add(key)
            }
            // Check if word matches any synonym value
            syns.forEach(syn => {
              if (word.includes(syn) || syn.includes(word)) {
                expanded.add(key)
                syns.forEach(s => expanded.add(s))
              }
            })
          }
        }
        return expanded
      }
      
      const questionWordSet = expandWithSynonyms(questionWords)
      const messageWordSet = expandWithSynonyms(messageWords)
      
      // Count matching words (including synonyms)
      let matchingWords = 0
      for (const word of questionWordSet) {
        if (messageWordSet.has(word)) {
          matchingWords++
        }
      }
      
      // Also check direct word matches (give bonus)
      const questionWordSetDirect = new Set(questionWords)
      const messageWordSetDirect = new Set(messageWords)
      for (const word of questionWords) {
        if (messageWordSetDirect.has(word)) {
          matchingWords += 0.5 // Bonus for exact word match
        }
      }
      
      // Calculate score: matching words / total unique words
      const totalUniqueWords = new Set([...questionWordSet, ...messageWordSet]).size
      const wordScore = totalUniqueWords > 0 ? Math.min(matchingWords / Math.max(totalUniqueWords, 1), 1.0) : 0
      
      // Boost score if most important words match (longer words are more important)
      let importantWordScore = 0
      const importantWords = questionWords.filter(w => w.length >= 4)
      if (importantWords.length > 0) {
        let matchingImportant = 0
        for (const word of importantWords) {
          if (messageWordSet.has(word) || 
              messageWords.some(mw => {
                const mwExpanded = expandWithSynonyms([mw])
                return mwExpanded.has(word) || questionWordSet.has(mw)
              })) {
            matchingImportant++
          }
        }
        importantWordScore = matchingImportant / importantWords.length
      }
      
      // Combined score (weighted average)
      const combinedScore = importantWords.length > 0 
        ? (wordScore * 0.5 + importantWordScore * 0.5)
        : wordScore
      
      if (combinedScore > bestScore) {
        bestScore = combinedScore
        bestMatch = qaPair
      }
    }

    // Apply confidence threshold (convert percentage to decimal if needed)
    // If threshold is > 1, it's a percentage (e.g., 100 = 1.0), otherwise it's already 0-1
    const threshold = intentConfidence > 1 ? intentConfidence / 100 : intentConfidence
    
    // Cap the threshold at 0.6 (60%) to allow more conversational flexibility
    // Even if user sets 100%, we cap it to allow general conversation
    // Use a minimum threshold of 0.2 (20%) for very lenient matching - act like we know everything
    const cappedThreshold = Math.min(threshold, 0.6)
    const effectiveThreshold = Math.max(cappedThreshold, 0.2)
    
    console.log(`[Fallback] Best match score: ${bestScore.toFixed(2)}, threshold: ${effectiveThreshold.toFixed(2)}, matched: ${bestMatch ? bestMatch.question : 'none'}`)
    
    // Always try to find the best match - provide direct answer only
    if (bestMatch && bestScore >= effectiveThreshold && !useGreetingResponse) {
      // High confidence match - provide direct answer only
      matchedQAPair = {
        question: bestMatch.question,
        answer: bestMatch.answer
      }
      answer = bestMatch.answer
      
      intent = bestMatch.intent || 'matched'
      confidence = Math.min(Math.round(bestScore * 100), 100)
    } else if (bestMatch && bestScore >= 0.2 && !useGreetingResponse) {
      // Lower confidence match (20%+) - provide direct answer only
      matchedQAPair = {
        question: bestMatch.question,
        answer: bestMatch.answer
      }
      
      // Provide direct answer without extra guidance
      answer = bestMatch.answer
      
      intent = bestMatch.intent || 'matched'
      confidence = Math.min(Math.round(bestScore * 100), 100)
    } else if (!useGreetingResponse && bestScore > 0.1 && bestMatch) {
      // Very low confidence but still some match (10-20%) - provide direct answer only
      matchedQAPair = {
        question: bestMatch.question,
        answer: bestMatch.answer
      }
      
      // Provide direct answer only
      answer = bestMatch.answer
      
      intent = 'matched'
      confidence = Math.min(Math.round(bestScore * 100), 100)
    } else if (useGreetingResponse) {
      // Use the greeting response we prepared earlier
      intent = greetingIntent
      confidence = greetingIntent === 'greeting' ? 95 : 90
    } else if (qaPairs && qaPairs.length > 0) {
      // No match found - provide simple, direct response
      answer = "I don't have information about that. Please ask a question related to the available topics."
      intent = 'no_match'
      confidence = 0
    }
  } else {
    // If there are no Q&A pairs at all, provide helpful guidance
    answer = "I'm here to help, but I don't have any information configured yet. Please contact the administrator to set up Q&A pairs for this chatbot. Once that's done, I'll be able to assist you with your questions!"
    intent = 'no_qa_pairs'
    confidence = 0
  }

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500))

  // Ensure confidence is between 0-100 (already in percentage format)
  const finalConfidence = Math.min(Math.max(Math.round(confidence), 0), 100)

  return {
    text: answer,
    intent: intent,
    confidence: finalConfidence,
    matchedQAPair: matchedQAPair,
    sources: matchedQAPair ? ['Q&A Pair'] : [],
    responseTime: 0.5
  }
}

// Simulate LLM response
async function simulateLLMResponse(message: string) {
  // Simulate LLM processing
  await new Promise(resolve => setTimeout(resolve, 1200))

  // In LLM mode we still allow more open answers, but keep a simple generic fallback.
  let response = 'I\'m here to help you with your questions. '
  response += 'For this demo LLM mode is not connected to your agent-specific Q&A yet.'

  return {
    text: response,
    confidence: 98,
    sources: ['FAQ.pdf', 'business-info.txt'],
    tokens: 245,
    responseTime: 1.2
  }
}
