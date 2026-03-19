# AI Chatbot Flow – Short Overview

## How it works end-to-end

1. **Frontend (Playground)**  
   User types a message in the agent Playground (CrewAI mode).

2. **Next.js API**  
   `POST /api/agents/[id]/chat` receives the message, agent ID, Q&A pairs, and intent confidence.

3. **CrewAI service**  
   The API calls the Python service at `CREWAI_SERVICE_URL` (default `http://localhost:8016`).

4. **Chat path**  
   - **First:** `POST /chat-content` (RAG) – used when the agent has scraped content or you want semantic + Q&A.  
   - **Fallback:** `POST /chat` – Q&A-only matching if RAG is down or returns low confidence.

5. **RAG answer pipeline** (`/chat-content` → `RAGAgent.answer`)  
   - **Search:** Vector search (FAISS + BGE embeddings) over scraped chunks + optional manual Q&A.  
   - **Rerank:** BGE re-ranker narrows to top chunks.  
   - **Synthesize:** LLM (Ollama or xAI) gets context + question and returns a short, direct answer (1–3 sentences).  
   - **Fallbacks:** If the LLM is unavailable or refuses: use direct Q&A match if similarity is high, else a clean 1–2 sentence excerpt from the top chunk (no raw dumps).

6. **Response back**  
   Returns `text`, `intent`, `confidence`, and `sources` to the frontend, which shows the reply and metadata (e.g. intent, confidence, sources).

---

## Scraping flow (data in)

1. User adds a URL in **Data Sources** (e.g. step 3 of agent creation).  
2. Frontend calls `POST /api/agents/new/scrape` (or similar), which calls CrewAI `POST /scrape`.  
3. **Scraper:** Async crawler (BeautifulSoup) + Playwright fallback if content is low.  
4. **Storage:** Content is saved per agent (e.g. temp ID then renamed when the agent is saved).  
5. **Indexing:** RAG indexes pages into the vector store (chunking → embeddings → FAISS).  
6. After that, **chat** uses this indexed content + any manual Q&A for answers.

---

## Main components

| Component        | Role |
|-----------------|------|
| **RAGAgent**    | Search (vector + Q&A), rerank, build prompt, call LLM, apply fallbacks (Q&A match, clean chunk excerpt). |
| **LLMAgent**    | Calls Ollama or xAI; generates short, direct answers from context. |
| **VectorStore**  | FAISS + BGE embeddings; stores and searches chunk vectors per agent. |
| **ContentStorage** | Loads/saves scraped content (pages) by agent ID. |
| **Scraper**      | AsyncWebsiteScraper + Playwright fallback for JS-heavy or low-content pages. |
| **QAMatcherAgent** | Semantic match over manual Q&A pairs; results merged with vector chunks before rerank. |

---

## Summary

- **User message** → Next.js API → **CrewAI `/chat-content`** → RAG (vector + Q&A search → rerank → LLM or chunk fallback) → **Short, direct answer** back to the UI.  
- **Scrape** → Async crawl (+ Playwright if needed) → Save content → Index into RAG → Ready for chat.  
- **Answer quality:** LLM gives 1–3 sentence answers; when the LLM is unavailable, the chunk fallback shows a clean 1–2 sentence excerpt instead of a raw content dump.
