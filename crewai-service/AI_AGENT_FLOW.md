# 🤖 AI Agent Flow: Link to Response

This guide explains how your AI agent processes information from the moment you add a website link to when it provides a chat response.

---

## 🏗️ Phase 1: Knowledge Acquisition (Step 3: Sources)

When you enter a website URL during agent creation, the follow process begins:

### 1. Web Crawling & Scraping
The agent uses a **Hybrid Scraper** (Playwright + BeautifulSoup) to:
- Navigate to your URL.
- Find and follow internal links (up to a limit).
- Extract clean text, headings, and metadata from each page.

### 2. Semantic Chunking
Extracted text is too large for the AI to "read" all at once. The **Semantic Chunker**:
- Splits the text into small pieces (chunks) of ~400 tokens.
- Ensures sentences aren't cut in half.
- Adds overlap between chunks so context isn't lost.

### 3. Vectorization & Indexing (BGE + FAISS)
The system converts each text chunk into a high-dimensional vector:
- **Embedding Model**: `BAAI/bge-base-en-v1.5` (State-of-the-art semantic understanding).
- **Index**: **FAISS** index stored on disk for lightning-fast retrieval.

---

## 💬 Phase 2: Answering a Question (Chat Interface)

When a user asks a question, the agent follows the **RAG (Retrieval-Augmented Generation)** pipeline:

### 1. Dual-Source Retrieval
The system simultaneously searches:
- **Website Content**: In the FAISS Vector Store.
- **Manual Q&A**: Any question/answer pairs you typed in manually.

### 2. Dual-Layer Retrieval (Re-ranking) 🔍
We use a sophisticated two-step search:
1. **Initial Search**: Retrieves the top 20 potential candidates using FAISS.
2. **Re-ranking**: A specialized **BGE Re-ranker** (`bge-reranker-base`) analyzes the candidates against your question and reshuffles them to put the absolute best 5 at the top. This effectively eliminates hallucinations.

### 3. Llama 3 Synthesis 🧠
The top 5 re-ranked results are sent to **Llama 3 (8B)**.
- **Strict Format**: We use Llama 3's special tag format (`<|begin_of_text|>`) to ensure it follows instructions perfectly.
- **Zero Hallucination**: The AI is forbidden from using its own memory; it acts as a "window" into your website content.

### 4. Robust Fallbacks 🛡️
To ensure the agent never leaves a user hanging:
- **LLM Error/Timeout**: If the AI brain takes too long (timeout), the system automatically returns the **Best Raw Chunk** directly.
- **Low Confidence**: If no match is above 0.3, the agent politely pivots: *"I don't have information on that specific topic, but I can tell you about [Topic A] which I found on the site."*

### 5. Source Attribution
The agent attaches the original URLs and page titles to the response, so users can verify where the information came from.

---

## 🚀 Why this is Premium
- **Faster than Search**: It doesn't "search" the live web every time; it uses the pre-built vector index (<10ms search).
- **No Hallucinations**: Because of strict grounding, it won't lie about your business.
- **Synthesized Knowledge**: It can combine information from 3 different pages into one single coherent answer.
