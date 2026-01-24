# Complete Agent Architecture & Process Flow

## 📊 System Overview

Your Chatbase Clone uses a **dual-mode AI agent system** with two distinct approaches:

1. **CrewAI Mode** - Q&A pair-based matching with semantic search
2. **RAG Mode** - Content-based retrieval using full scraped website content

---

## 🏗️ Complete Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Agent Builder│  │ Agent Create │  │  Chat Widget │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
┌─────────────────────────────────────────────────────────────────┐
│              Next.js API Routes (pages/api/)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ /api/agents/ │  │ /api/agents/ │  │ /api/auth/   │        │
│  │  [id]/chat   │  │  [id]/scrape │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            │
┌─────────────────────────────────────────────────────────────────┐
│         Python FastAPI Service (Port 8000)                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    API Endpoints                          │ │
│  │  • POST /chat          (CrewAI Mode - Q&A pairs)         │ │
│  │  • POST /chat-content  (RAG Mode - Content-based)         │ │
│  │  • POST /scrape        (Website scraping)                 │ │
│  │  • GET  /health        (Health check)                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Core Agents & Modules                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │Intent        │  │QA Matcher    │  │Content       │  │ │
│  │  │Classifier    │  │(Semantic)    │  │Retriever     │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │Response      │  │LLM Agent      │  │Website       │  │ │
│  │  │Generator     │  │(Ollama)       │  │Scraper       │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Storage & Data                               │ │
│  │  • ContentStorage (JSON files)                            │ │
│  │  • Sentence Transformers (Embeddings)                     │ │
│  │  • content_storage/ directory                             │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│  • Ollama (Local LLM) - http://localhost:11434                  │
│  • PostgreSQL (Database)                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Process Flow

### **Mode 1: CrewAI Mode (Q&A Pair-Based)**

```
User Question
    ↓
Next.js API: /api/agents/[id]/chat
    ↓
Python Service: POST /chat
    ↓
┌─────────────────────────────────────┐
│ Step 1: Intent Classification      │
│ • IntentClassifierAgent            │
│ • Classifies: pricing, support,    │
│   general, etc.                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 2: Q&A Matching                │
│ • QAMatcherAgent                    │
│ • Uses Sentence Transformers       │
│ • Model: all-MiniLM-L6-v2          │
│ • Semantic similarity matching     │
│ • Returns: best match + top 5       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 3: Confidence-Based Routing   │
│                                     │
│ Confidence < 20%:                   │
│   → Direct answer (no LLM)          │
│                                     │
│ Confidence 20-70%:                   │
│   → LLM Agent.generate_answer()     │
│   → Uses top 5 Q&A pairs as context │
│                                     │
│ Confidence 70-85%:                   │
│   → LLM Agent.refine_answer()       │
│   → Refines matched answer          │
│                                     │
│ Confidence > 85%:                    │
│   → ResponseGenerator               │
│   → Direct answer (fast path)        │
└─────────────────────────────────────┘
    ↓
Response to User
```

### **Mode 2: RAG Mode (Content-Based)**

```
User Question
    ↓
Next.js API: /api/agents/[id]/chat
    ↓
Python Service: POST /chat-content
    ↓
┌─────────────────────────────────────┐
│ Step 1: Load Stored Content        │
│ • ContentStorage.load_content()    │
│ • Loads from content_storage/      │
│   {agent_id}.json                  │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 2: Chunk Content               │
│ • ContentStorage.get_content_chunks()│
│ • Splits into 1000-char chunks      │
│ • Preserves URL, title metadata     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 3: Semantic Search             │
│ • ContentRetrieverAgent             │
│ • Model: all-MiniLM-L6-v2          │
│ • Embeds query + all chunks         │
│ • Cosine similarity                 │
│ • Returns top 3 relevant chunks     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 4: Check Confidence            │
│ • If similarity < threshold:        │
│   → "No relevant info found"        │
│ • Else: continue                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 5: Generate Answer             │
│ • LLM Agent.generate_answer_from_   │
│   content()                         │
│ • Ollama with context chunks        │
│ • Grounded in scraped content        │
└─────────────────────────────────────┘
    ↓
Response with Sources
```

### **Website Scraping Process**

```
User enters URL in Step 1
    ↓
Next.js API: /api/agents/[id]/scrape
    ↓
Python Service: POST /scrape
    ↓
┌─────────────────────────────────────┐
│ AsyncWebsiteScraper                │
│ • httpx.AsyncClient                │
│ • BeautifulSoup4                   │
│ • Multi-page crawling              │
│ • Concurrency: 5 workers            │
│ • Max pages: 100 (default)          │
│ • Max depth: 5 levels               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ For Each Page:                      │
│ • Extract: title, meta, headings,   │
│   paragraphs, images, main content  │
│ • Find all internal links           │
│ • Normalize URLs                    │
│ • Save as JSON file                 │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Content Storage                     │
│ • Save to content_storage/          │
│   {agent_id}.json                   │
│ • Combines all pages                │
│ • Ready for RAG retrieval            │
└─────────────────────────────────────┘
```

---

## 🧩 Component Breakdown

### **1. Intent Classifier Agent** (`agents/intent_classifier.py`)

**What it does:**
- Classifies user queries into intents (pricing, support, general, etc.)
- Uses keyword matching and pattern detection

**Technologies:**
- Python (no ML model, rule-based)

**Input:** User message, Q&A pairs  
**Output:** Intent type, confidence score

---

### **2. QA Matcher Agent** (`agents/qa_matcher.py`)

**What it does:**
- Finds best matching Q&A pair for user query
- Uses semantic similarity (Sentence Transformers)
- Falls back to keyword matching if model unavailable

**Technologies:**
- `sentence-transformers` (all-MiniLM-L6-v2)
- NumPy for cosine similarity
- Fallback: keyword matching

**Input:** User message, Q&A pairs list, intent  
**Output:** Best match with confidence, top 5 matches

**Process:**
1. Filter Q&A pairs by intent
2. Embed query + all questions
3. Calculate cosine similarity
4. Return best match + top K

---

### **3. Content Retriever Agent** (`agents/content_retriever.py`)

**What it does:**
- Retrieves relevant content chunks for RAG
- Uses semantic search over scraped content

**Technologies:**
- `sentence-transformers` (all-MiniLM-L6-v2)
- NumPy for similarity calculation
- Fallback: keyword matching

**Input:** User query, content chunks  
**Output:** Top K relevant chunks with similarity scores

**Process:**
1. Embed user query
2. Embed all content chunks
3. Calculate cosine similarity
4. Return top K chunks sorted by relevance

---

### **4. LLM Agent** (`agents/llm_agent.py`)

**What it does:**
- Generates/refines answers using local LLM (Ollama)
- Three methods:
  - `generate_answer()` - From Q&A pairs
  - `refine_answer()` - Refine existing answer
  - `generate_answer_from_content()` - From scraped content (RAG)

**Technologies:**
- Ollama (local LLM server)
- Model: `phi3:mini` (default, 3.8B parameters)
- HTTP requests to Ollama API

**Input:** User query, context (Q&A pairs or content chunks)  
**Output:** Generated answer string

**Features:**
- Checks Ollama availability on init
- Handles timeouts gracefully
- Fallback to direct answers if LLM unavailable
- Cleans prompt artifacts from responses

---

### **5. Response Generator** (`agents/response_generator.py`)

**What it does:**
- Generates direct responses for high-confidence matches
- Fast path (no LLM call needed)

**Technologies:**
- Python (rule-based)

**Input:** User message, matched Q&A pair, intent  
**Output:** Formatted response text

---

### **6. Website Scraper** (`scraper/async_website_scraper.py`)

**What it does:**
- Scrapes entire websites asynchronously
- Multi-page crawling with concurrency control
- Extracts detailed content

**Technologies:**
- `httpx` (async HTTP client)
- `beautifulsoup4` (HTML parsing)
- `lxml` (parser)
- `asyncio` (concurrency)
- `aiofiles` (async file I/O)

**Features:**
- Async/await throughout
- Semaphore-based concurrency (default: 5)
- Queue-based URL management
- URL normalization (removes fragments, trailing slashes)
- Respects robots.txt
- Configurable delays (politeness)
- Saves each page as JSON

**Extracts:**
- Title, meta description
- Headings (h1, h2, h3)
- Paragraphs
- Images (src, alt)
- Main content
- Links

---

### **7. Content Storage** (`content_storage.py`)

**What it does:**
- Stores scraped content as JSON files
- Chunks content for retrieval
- Manages agent-specific content

**Technologies:**
- Python `json` module
- `pathlib` for file operations

**Storage Structure:**
```
content_storage/
  {agent_id}.json
```

**JSON Structure:**
```json
{
  "agent_id": "...",
  "base_url": "...",
  "scraped_at": "...",
  "stats": {...},
  "pages": [...],
  "full_content": "...",
  "metadata": {...},
  "headings": [...]
}
```

**Methods:**
- `save_content()` - Save scraped content
- `load_content()` - Load content for agent
- `get_content_chunks()` - Split into chunks for retrieval
- `delete_content()` - Remove agent content

---

## 🔧 Technology Stack Summary

### **Backend (Python FastAPI)**
- **Framework:** FastAPI 0.104.1
- **Server:** Uvicorn
- **HTTP Client:** httpx (async), requests (sync)
- **HTML Parsing:** BeautifulSoup4, lxml
- **AI/ML:**
  - Sentence Transformers (all-MiniLM-L6-v2)
  - Ollama (phi3:mini)
- **Storage:** JSON files, PostgreSQL (via Prisma)
- **Concurrency:** asyncio, semaphores, queues

### **Frontend (Next.js)**
- **Framework:** Next.js 14.2
- **Language:** TypeScript
- **UI:** Radix UI, Tailwind CSS
- **State:** React Context API
- **Auth:** NextAuth.js
- **Database:** Prisma ORM

---

## 📋 Current Implementation Status

### ✅ **What's Working Well**

1. **Dual-Mode System**
   - CrewAI mode (Q&A pairs) ✅
   - RAG mode (content-based) ✅
   - Both integrated and functional

2. **Semantic Search**
   - Sentence Transformers working ✅
   - Cosine similarity calculation ✅
   - Fallback to keyword matching ✅

3. **Website Scraping**
   - Async multi-page crawling ✅
   - Detailed content extraction ✅
   - JSON storage per page ✅
   - Error handling ✅

4. **LLM Integration**
   - Ollama integration ✅
   - Three generation modes ✅
   - Graceful fallbacks ✅

5. **Content Storage**
   - JSON-based storage ✅
   - Chunking for retrieval ✅
   - Agent-specific isolation ✅

### ⚠️ **What Could Be Improved**

1. **No Persistent Vector Database**
   - Embeddings computed on-the-fly
   - Should persist embeddings for faster retrieval

2. **Limited Prompt Engineering**
   - Basic prompts, could be more grounded
   - No explicit "don't hallucinate" constraints

3. **No Re-ranking**
   - Only initial semantic search
   - Could use cross-encoder for better results

4. **Chunking Strategy**
   - Simple word-based chunking
   - Could use semantic chunking (sentence boundaries)

5. **No Caching**
   - Embeddings recomputed each time
   - No query result caching

6. **JavaScript Sites**
   - Can't handle JS-rendered content
   - Would need Playwright/Selenium

---

## 🔄 Complete Data Flow Example

### **Scenario: User asks "What is your pricing?"**

#### **CrewAI Mode Flow:**

```
1. User: "What is your pricing?"
   ↓
2. Frontend → POST /api/agents/123/chat
   Body: {
     message: "What is your pricing?",
     responseMode: "crewai",
     qaPairs: [
       {question: "What is your pricing?", answer: "Our pricing starts at $99/month..."},
       {question: "How much does it cost?", answer: "..."}
     ]
   }
   ↓
3. Next.js API → POST http://localhost:8000/chat
   ↓
4. Python Service:
   a) IntentClassifier → "pricing" intent
   b) QAMatcher → Finds "What is your pricing?" (confidence: 0.95)
   c) Confidence > 85% → ResponseGenerator
   d) Returns direct answer
   ↓
5. Response: {
     text: "Our pricing starts at $99/month...",
     intent: "pricing",
     confidence: 95
   }
```

#### **RAG Mode Flow:**

```
1. User: "What is your pricing?"
   ↓
2. Frontend → POST /api/agents/123/chat
   Body: {
     message: "What is your pricing?",
     responseMode: "rag",
     agentId: "agent-123"
   }
   ↓
3. Next.js API → POST http://localhost:8000/chat-content
   ↓
4. Python Service:
   a) ContentStorage.load_content("agent-123")
   b) ContentStorage.get_content_chunks() → 50 chunks
   c) ContentRetriever.find_relevant_chunks():
      - Embed query: "What is your pricing?"
      - Embed all 50 chunks
      - Calculate similarities
      - Return top 3 chunks
   d) LLM Agent.generate_answer_from_content():
      - Build prompt with top 3 chunks
      - Call Ollama
      - Generate answer
   ↓
5. Response: {
     text: "Based on our website, pricing starts at $99/month...",
     intent: "content_based",
     confidence: 87,
     sources: [
       {url: "https://example.com/pricing", title: "Pricing", relevance: 0.92}
     ]
   }
```

---

## 🎯 Key Technologies Used

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Semantic Search** | Sentence Transformers (all-MiniLM-L6-v2) | Embed queries and content for similarity |
| **LLM** | Ollama (phi3:mini) | Generate/refine answers |
| **Web Scraping** | BeautifulSoup4 + httpx | Parse HTML, async HTTP |
| **Storage** | JSON files | Store scraped content |
| **API** | FastAPI | REST API endpoints |
| **Concurrency** | asyncio | Parallel scraping |
| **Database** | PostgreSQL + Prisma | User/agent data |

---

## 📊 Current Capabilities

### **What Your Agent Can Do:**

✅ **Scrape entire websites** (up to 100 pages, 5 levels deep)  
✅ **Extract detailed content** (title, headings, paragraphs, images)  
✅ **Store content** in JSON format  
✅ **Semantic search** over scraped content  
✅ **Answer questions** using RAG (content-based)  
✅ **Match Q&A pairs** using semantic similarity  
✅ **Generate answers** with local LLM (Ollama)  
✅ **Classify intents** (pricing, support, general)  
✅ **Handle errors gracefully** with fallbacks  
✅ **Support dual modes** (CrewAI + RAG)  

### **What It Can't Do Yet:**

❌ Handle JavaScript-rendered websites (needs Playwright)  
❌ Persist embeddings in vector DB (recomputes each time)  
❌ Re-rank results (only initial semantic search)  
❌ Cache query results  
❌ Incremental re-scraping (always full scrape)  
❌ Multi-language detection/processing  

---

## 🚀 Quick Reference

### **API Endpoints:**

1. **POST /chat** - CrewAI mode (Q&A pairs)
2. **POST /chat-content** - RAG mode (content-based)
3. **POST /scrape** - Scrape website
4. **GET /health** - Health check

### **Key Files:**

- `main.py` - FastAPI app, endpoints
- `agents/intent_classifier.py` - Intent classification
- `agents/qa_matcher.py` - Q&A matching
- `agents/content_retriever.py` - Semantic search
- `agents/llm_agent.py` - LLM integration
- `scraper/async_website_scraper.py` - Website scraping
- `content_storage.py` - Content management

### **Configuration:**

- **Ollama:** `OLLAMA_URL`, `OLLAMA_MODEL` env vars
- **Scraping:** `max_pages`, `max_depth`, `concurrency`, `delay`
- **Confidence:** `MIN_KB_CONFIDENCE = 0.2`, `LLM_LOW_CONFIDENCE_THRESHOLD = 0.7`

---

This is your complete system architecture! The agent uses **semantic search** (Sentence Transformers) for both Q&A matching and content retrieval, combined with **Ollama LLM** for answer generation, all backed by **async website scraping** that stores content in JSON format.
