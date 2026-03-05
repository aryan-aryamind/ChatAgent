
import sys
import os
import asyncio
from dotenv import load_dotenv

# Force UTF-8 for Windows terminal
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from rag_agent import RAGAgent
from agents.llm_agent import LLMAgent

async def diagnose_retrieval(agent_id, query):
    load_dotenv()
    llm_agent = LLMAgent()
    rag = RAGAgent(agent_id=agent_id, llm_agent=llm_agent)
    
    print(f"\n--- DIAGNOSING RETRIEVAL FOR AGENT: {agent_id} ---")
    print(f"Query: {query}")
    
    # Check Stats
    stats = rag.get_stats()
    print(f"\nStats: {stats}")
    
    # 1. Raw Doc Search
    print("\n--- 1. RAW DOC SEARCH (top 10) ---")
    doc_hits = rag.search_docs(query, top_k=10, min_similarity=0.0)
    for i, hit in enumerate(doc_hits):
        print(f"[{i+1}] Score: {hit['similarity_score']:.4f} | URL: {hit.get('url')} | Title: {hit.get('title')}")
        print(f"    Snippet: {hit.get('text')[:200]}...")
    
    # 2. Intent & Pipeline Search
    print("\n--- 2. FULL PIPELINE SEARCH ---")
    # We call internal methods to see the flow
    rewritten_query = rag.rewrite_query(query)
    print(f"Rewritten Query: {rewritten_query}")
    
    faq_hits = rag.search_faq(rewritten_query, top_k=3, min_similarity=0.1)
    doc_hits_2 = rag.search_docs(rewritten_query, top_k=20, min_similarity=0.1)
    
    final_chunks = rag._rerank_and_merge(rewritten_query, doc_hits_2, faq_hits)
    print(f"\nFinal Chunks after Reranking ({len(final_chunks)}):")
    for i, chunk in enumerate(final_chunks):
        score = chunk.get('rerank_score', 'N/A')
        print(f"[{i+1}] Rerank Score: {score} | URL: {chunk.get('url')} | Title: {chunk.get('title')}")
        print(f"    Text: {chunk.get('text')}")

    # 3. List all URLs in the index
    print("\n--- 3. ALL URLS IN INDEX ---")
    urls = set()
    if hasattr(rag.doc_store, 'metadata'):
        for m in rag.doc_store.metadata:
            urls.add(m.get('url'))
    for url in sorted(list(urls)):
        print(f"- {url}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python diagnose_retrieval.py <agent_id> <query>")
        sys.exit(1)
    
    agent_id = sys.argv[1]
    query = sys.argv[2]
    asyncio.run(diagnose_retrieval(agent_id, query))
