import asyncio
from rag_agent import RAGAgent
from agents.llm_agent import LLMAgent
import sys
import io

import logging

# Configure logging to see VectorStore errors
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Force UTF-8 for Windows terminal
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def verify():
    agent_id = "1772533471859"
    query = "which keyboards do you have"
    
    llm = LLMAgent()
    rag = RAGAgent(agent_id=agent_id, llm_agent=llm)
    
    print(f"--- Testing Query: {query} ---")
    print(f"Vector Store Docs Path: {rag.doc_store.index_path.absolute()}")
    print(f"Index File Exists: {rag.doc_store.index_path.exists()}")
    print(f"Metadata File Exists: {rag.doc_store.metadata_path.exists()}")
    
    # Full answer pipeline
    result = rag.answer(query)
    
    print("\n--- FINAL ANSWER ---")
    print(result['answer'])
    print("\n--- SOURCES ---")
    for s in result['sources']:
        print(f" - {s['url']} ({s['title']})")
        
    # Also test price grounding for mouse
    print("\n\n--- Testing Price Grounding: 'What is the price of the mouse?' ---")
    result_price = rag.answer("What is the price of the mouse?")
    print("\n--- FINAL ANSWER ---")
    print(result_price['answer'])

if __name__ == "__main__":
    asyncio.run(verify())
