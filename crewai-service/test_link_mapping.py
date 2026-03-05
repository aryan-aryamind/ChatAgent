
import os
import sys
import asyncio
import logging

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag_agent import RAGAgent
from agents.llm_agent import LLMAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_mapping():
    agent_id = "1772535452468" # MedTrust Agent ID
    
    # Mock LLM Agent since we only care about retrieval and reranking for now
    class MockLLM:
        def chat(self, system, user, **kwargs):
            return "Mock response"
    
    llm = MockLLM()
    rag = RAGAgent(agent_id, llm)
    
    queries = [
        "how can i contact you?",
        "what is your phone number?",
        "how to reach out to medtrust?",
        "where is your office located?",
        "about your company"
    ]
    
    print(f"\n{'='*50}")
    print(f"Testing Link Mapping for Agent: {agent_id}")
    print(f"{'='*50}\n")
    
    for query in queries:
        print(f"\nQuery: '{query}'")
        # Direct call to _rerank_and_merge if it was public, but we can use answer() 
        # with a modified synthesis agent or just inspect the RAGAgent's internals if needed.
        # RAGAgent.answer calls search and then synthesizes. 
        # Let's check search results directly.
        
        results = rag.search(query, n_results=10)
        
        print(f"{'URL':<40} | {'Score':<10} | {'Title'}")
        print("-" * 80)
        for res in results:
            url = res.get('url', 'N/A')
            score = res.get('rerank_score', res.get('similarity_score', 0))
            title = res.get('title', 'N/A')
            print(f"{str(url)[:40]:<40} | {score:<10.4f} | {title}")

if __name__ == "__main__":
    asyncio.run(test_mapping())
