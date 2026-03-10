import os
import sys
from dotenv import load_dotenv
from rag_agent import RAGAgent
from content_storage import ContentStorage
from agents.llm_agent import LLMAgent

def diagnose_agent(agent_id):
    load_dotenv()
    print(f"--- Diagnosing Agent: {agent_id} ---")
    
    # 1. Check Content Storage
    storage = ContentStorage()
    content = storage.load_content(agent_id)
    if not content:
        print("❌ No content found in ContentStorage for this agent ID.")
        return
    
    print(f"✅ Content found. Title: {content.get('title')}, URL: {content.get('base_url')}")
    print(f"📄 Pages indexed: {len(content.get('pages', []))}")
    
    # 2. Check Vector Store
    llm_provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    llm_model = os.getenv("OLLAMA_MODEL", "llama3")
    llm_agent = LLMAgent(model_name=llm_model, provider="ollama")
    
    rag = RAGAgent(agent_id=agent_id, llm_agent=llm_agent)
    stats = rag.get_stats()
    
    if stats["vector_store"]["index_exists"]:
        print(f"✅ Vector store index exists. Chunks: {stats['vector_store']['total_chunks']}")
    else:
        print("⚠️ Vector store index NOT found. Agent might need re-indexing.")
    
    # 3. Test Retrieval
    test_query = "What is this website about?"
    print(f"\n--- Testing Retrieval for: '{test_query}' ---")
    results = rag.answer(test_query)
    
    print(f"Intent: {results.get('intent')}")
    print(f"Confidence: {results.get('confidence')}")
    print(f"Answer Sample: {results.get('answer')[:100]}...")
    
    if results.get('confidence', 0) < 30:
        print("⚠️ LOw confidence detected. This explains why the bot might say 'I don't have that information'.")

if __name__ == "__main__":
    agent_id = "cmmj2xtti00057pugq3ph8r30"
    diagnose_agent(agent_id)
