import os
import sys
from dotenv import load_dotenv
from rag_agent import RAGAgent
from content_storage import ContentStorage
from agents.llm_agent import LLMAgent

def fix_indexing(agent_id):
    load_dotenv()
    print(f"--- Fixing Indexing for Agent: {agent_id} ---")
    
    # 1. Load Content
    storage = ContentStorage()
    content = storage.load_content(agent_id)
    if not content or 'pages' not in content:
        print("❌ No scraped content found to index.")
        return
    
    pages = content['pages']
    print(f"✅ Found {len(pages)} pages in storage.")
    
    # 2. Setup RAG Agent
    llm_provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    if llm_provider == "groq":
        llm_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        llm_agent = LLMAgent(model_name=llm_model, provider="groq", api_key=os.getenv("GROQ_API_KEY"), base_url=os.getenv("GROQ_BASE_URL"))
    else:
        llm_model = os.getenv("OLLAMA_MODEL", "phi3:mini")
        llm_agent = LLMAgent(model_name=llm_model, provider="ollama")
        
    rag = RAGAgent(agent_id=agent_id, llm_agent=llm_agent)
    
    # 3. Perform Indexing
    print("🔄 Starting indexing process...")
    try:
        # Convert pages to required format if needed (main.py does this)
        formatted_pages = []
        for page in pages:
            if isinstance(page, dict):
                formatted_pages.append(page)
            else:
                # Handle cases where pages might be objects
                formatted_pages.append({
                    "url": getattr(page, "url", ""),
                    "title": getattr(page, "title", ""),
                    "main_content": getattr(page, "main_content", "") or content.get("full_content", ""),
                    "headings": getattr(page, "headings", []),
                    "paragraphs": getattr(page, "paragraphs", []),
                })
        
        result = rag.index_content(formatted_pages)
        print(f"✅ Indexing complete! Stats: {result}")
        
        # 4. Verify again
        stats = rag.get_stats()
        if stats["vector_store"]["index_exists"]:
            print(f"✨ Success! Vector store now has {stats['vector_store']['total_chunks']} chunks.")
        else:
            print("❌ Indexing failed to create a vector store file.")
            
    except Exception as e:
        print(f"❌ Error during indexing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    agent_id = "cmmj2xtti00057pugq3ph8r30"
    fix_indexing(agent_id)
