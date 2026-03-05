
import sys
import os
import asyncio
from dotenv import load_dotenv

sys.path.append(os.getcwd())

from rag_agent import RAGAgent
from agents.llm_agent import LLMAgent

async def list_urls(agent_id):
    load_dotenv()
    llm_agent = LLMAgent()
    rag = RAGAgent(agent_id=agent_id, llm_agent=llm_agent)
    
    urls = set()
    if hasattr(rag.doc_store, 'metadata'):
        for m in rag.doc_store.metadata:
            urls.add(m.get('url'))
    
    print(f"--- INDEXED URLS FOR AGENT: {agent_id} ---")
    for url in sorted(list(urls)):
        print(f"- {url}")
    print(f"Total Unique URLs: {len(urls)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python list_urls.py <agent_id>")
        sys.exit(1)
    asyncio.run(list_urls(sys.argv[1]))
