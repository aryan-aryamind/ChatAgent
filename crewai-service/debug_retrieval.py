
import asyncio
import os
import sys
import io
from dotenv import load_dotenv

# Fix for Windows terminal emoji encoding
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Ensure we can import from the current directory
sys.path.append(os.getcwd())

from rag_agent import RAGAgent
from agents.llm_agent import LLMAgent

# Load environment variables
load_dotenv()

async def debug_retrieval():
    agent_id = "1772513347369"
    # Testing for standalone mouse and combo
    queries = [
        "give me the mouse price wireless and more deatils",
        "wireless mouse price",
        "gaming combo price"
    ]
    
    # Initialize LLM Agent as in main.py
    llm_provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    if llm_provider == "xai":
        llm_agent = LLMAgent(model_name=os.getenv("XAI_MODEL", "grok-3-mini"), provider="xai", api_key=os.getenv("XAI_API_KEY"), base_url=os.getenv("XAI_BASE_URL"))
    elif llm_provider == "groq":
        llm_agent = LLMAgent(model_name=os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile"), provider="groq", api_key=os.getenv("GROQ_API_KEY"), base_url=os.getenv("GROQ_BASE_URL"))
    else:
        llm_agent = LLMAgent(model_name=os.getenv("OLLAMA_MODEL", "llama3"), provider="ollama", base_url=os.getenv("OLLAMA_URL", "http://localhost:11434"))

    # Initialize RAGAgent directly
    print(f"🆕 Initializing RAG Agent for: {agent_id}")
    rag = RAGAgent(
        agent_id=agent_id, 
        llm_agent=llm_agent, 
        persona_type="general",
        base_company_info="Techify is an electronics retailer."
    )
    
    for query in queries:
        print(f"\n" + "="*50)
        print(f"--- DEBUGGING RETRIEVAL FOR: '{query}' ---")
        
        # Search Docs
        doc_hits = rag.search_docs(query, top_k=20, min_similarity=0.1)
        print(f"\nFound {len(doc_hits)} document hits.")
        
        for i, hit in enumerate(doc_hits[:5]):
            print(f"\nHIT {i+1} (Score: {hit.get('similarity_score', 0):.4f})")
            print(f"URL: {hit.get('url')}")
            print(f"TEXT Samples: {hit.get('text')[:200]}...")

        # Answer attempt
        print(f"\n--- GENERATING ANSWER ---")
        result = rag.answer(query)
        print(f"\nFINAL ANSWER:\n{result['answer']}")

if __name__ == "__main__":
    asyncio.run(debug_retrieval())
