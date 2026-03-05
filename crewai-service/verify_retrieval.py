
import sys
import os
import asyncio
from dotenv import load_dotenv

# Force UTF-8 for Windows terminal
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from rag_agent import RAGAgent
from agents.llm_agent import LLMAgent

async def verify_retrieval():
    load_dotenv()
    llm_agent = LLMAgent()
    
    # Use the Techify Hub agent ID
    agent_id = "1772523473222"
    rag = RAGAgent(agent_id=agent_id, llm_agent=llm_agent)
    
    query = "what is contact us deatils of techify"
    print(f"\n--- VERIFYING RETRIEVAL FOR: {query} ---")
    
    # Test the re-ranking logic with current index
    # (Note: Some chunks might be missing if they were filtered during indexing, 
    # but reranking should still help prioritize any existing contact chunks)
    
    # Use internal search to see scores
    doc_hits = rag.search_docs(query, top_k=20, min_similarity=0.0)
    faq_hits = []
    
    final_chunks = rag._rerank_and_merge(query, doc_hits, faq_hits)
    
    print(f"\nTop 5 Results after Reranking:")
    found_contact = False
    for i, chunk in enumerate(final_chunks[:5]):
        url = chunk.get('url', 'N/A')
        score = chunk.get('rerank_score', 'N/A')
        print(f"[{i+1}] Score: {score:.4f} | URL: {url}")
        if "contact" in url.lower():
            found_contact = True
            print(f"    ✅ Matches contact page!")
            print(f"    Text: {chunk.get('text')[:200]}...")
            
    if found_contact:
        print("\n✅ SUCCESS: Contact page is now prioritized in the top results.")
    else:
        print("\n❌ FAILURE: Contact page not found or not prioritized. A re-scrape might be needed to index missing chunks.")

if __name__ == "__main__":
    asyncio.run(verify_retrieval())
