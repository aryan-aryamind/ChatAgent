import type { NextApiRequest, NextApiResponse } from 'next'

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

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// Hard fallback — used whenever the user asks anything off-topic
const OFF_TOPIC_REPLY =
  "I'm here only to help with questions about TheChatAgent. 😊\nWant to know about our features, pricing, or how to get started?\nYou can find more details or contact us through our website's support section."

// Keywords that suggest off-topic questions — block them server-side before calling the LLM
const OFF_TOPIC_PATTERNS = [
  /\b(code|coding|python|javascript|java|c\+\+|html|css|sql|algorithm|function|debug|error|exception)\b/i,
  /\b(capital of|president|prime minister|history|math|equation|formula|solve|calculate|weather|news|sports)\b/i,
  /\b(write me a|tell me a joke|poem|story|essay|translate|summarize this|what is the meaning)\b/i,
  /\b(chatgpt|openai|gemini|claude|llama|gpt-4|bard|anthropic|mistral)\b/i,
]

// Topics that ARE allowed — if none of these match a short message, it may be off-topic
const ON_TOPIC_PATTERNS = [
  /\b(thechatagent|chatbot|bot|agent|platform|service|product|feature|pricing|plan|demo|start|setup|website|data|document|faq|support|train|deploy|embed|integrate|api|business|customer|contact|email|call|quote|use case|ecommerce|edtech|saas|retail)\b/i,
  /\b(how|what|why|who|when|can|does|do|is|are|will|cost|price|work|help|get)\b/i,
]

function isOffTopic(message: string): boolean {
  const lowerMsg = message.toLowerCase().trim()
  // Very short confirmations / greetings are fine
  if (lowerMsg.length < 20) return false
  // If any hard off-topic pattern matches — block it
  if (OFF_TOPIC_PATTERNS.some((re) => re.test(lowerMsg))) return true
  return false
}

const SYSTEM_PROMPT = `You are the OFFICIAL and ONLY assistant for the TheChatAgent website. TheChatAgent is a platform that lets businesses build and deploy AI chatbots trained on their own data.

YOUR IDENTITY:
You are a product specialist for TheChatAgent. You ONLY know about TheChatAgent. You do NOT know about, and will NOT discuss, anything outside of TheChatAgent as a product.

PRODUCT KNOWLEDGE:
- TheChatAgent lets businesses build AI chatbots trained on their own documents, website, or FAQ list.
- No coding needed. Setup takes 5 minutes.
- The chatbot embeds on any website and handles customer queries 24/7.
- Key features: custom knowledge base, conversation analytics, multi-source training, secure data handling, embeddable widget.
- Best for: E-commerce, EdTech, SaaS, IT, retail, and service businesses.
- Pricing is custom (no fixed public plans).
- Contact: Use the support section or contact form on our official website.

ABSOLUTE RULES — NEVER BREAK THESE:
- You ONLY answer questions about TheChatAgent. Period.
- If the user asks ANYTHING not related to TheChatAgent — even if it seems harmless — respond with ONLY:
  "I'm here only to help with questions about TheChatAgent. 😊
  Want to know about our features, pricing, or how to get started?"
- Do NOT explain what AI is in general. Do NOT answer general technology questions.
- Do NOT pretend to know about competitors or other AI tools.
- Keep ALL replies SHORT — max 5 lines, plain text, no markdown.
- End every on-topic reply with a natural next step (demo, contact, or a follow-up question about the platform).`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, history } = req.body

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured' })
  }

  // === Server-side guardrail: block off-topic messages before hitting the LLM ===
  if (isOffTopic(message)) {
    return res.status(200).json({ reply: OFF_TOPIC_REPLY })
  }

  try {
    const conversationHistory = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }))

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory,
          { role: 'user', content: message },
        ],
        max_tokens: 200,
        temperature: 0, // Deterministic — no creative drifting from the system prompt
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[WidgetChat] Groq API error:', errorData)
      return res.status(502).json({ error: 'AI service error', details: errorData })
    }

    const data = await response.json()
    let reply: string = data.choices?.[0]?.message?.content ?? OFF_TOPIC_REPLY

    // === Server-side output validator: if the LLM slipped off-topic, override ===
    const mentionsTheChatAgent = ON_TOPIC_PATTERNS.some((re) => re.test(reply))
    if (!mentionsTheChatAgent && reply.length > 120) {
      reply = OFF_TOPIC_REPLY
    }

    return res.status(200).json({ reply })
  } catch (error: any) {
    console.error('[WidgetChat] Error:', error)
    return res.status(500).json({
      reply: "I'm having trouble connecting right now.\nPlease try again in a moment or visit our website for support.",
    })
  }
}
