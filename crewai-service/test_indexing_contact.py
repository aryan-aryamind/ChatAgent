
import sys
import os
import json
import asyncio
from dotenv import load_dotenv

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from rag_agent import RAGAgent
from agents.llm_agent import LLMAgent

def is_readable_text(text: str) -> bool:
    """Check if text is readable (not binary/garbled) - Same as main.py"""
    if not text:
        return False
    # Check if text contains mostly printable ASCII/Unicode characters
    printable_ratio = sum(1 for c in text[:1000] if c.isprintable() or c.isspace()) / min(len(text), 1000)
    # Check for excessive non-ASCII characters that might indicate binary data
    non_ascii_ratio = sum(1 for c in text[:1000] if ord(c) > 127) / min(len(text), 1000)
    # Text should be mostly printable and not too many high-unicode chars
    return printable_ratio > 0.7 and non_ascii_ratio < 0.5

async def test_indexing():
    load_dotenv()
    llm_agent = LLMAgent()
    agent_id = "test-agent-indexing"
    rag_agent = RAGAgent(agent_id=agent_id, llm_agent=llm_agent)
    
    # Load actual scraped contact data
    contact_json_path = "d:/Chatbase-Clone/crewai-service/content_storage/techifyhub_in_contact.json"
    with open(contact_json_path, 'r', encoding='utf-8') as f:
        page_data = json.load(f)
    
    print(f"--- TESTING INDEXING FOR: {page_data['url']} ---")
    page_content = page_data.get('main_content', '')
    print(f"Content Length: {len(page_content)}")
    print(f"Content Sample: {repr(page_content[:100])}")
    
    # Simulate main.py logic
    page_url_lower = (page_data.get('url') or "").lower().rstrip('/')
    is_info_page = any(w in page_url_lower for w in ["contact", "about", "support", "headquarter", "location"])
    min_len = 15 if is_info_page else 50
    
    print(f"Is Info Page: {is_info_page}")
    print(f"Required Min Len: {min_len}")
    
    if page_content and len(page_content.strip()) > min_len:
        if is_readable_text(page_content):
            print("✅ main.py: Page is eligible for indexing.")
            
            # Prepare pages for indexing
            pages_for_indexing = [{
                "url": page_data['url'],
                "title": page_data.get('title') or "Untitled",
                "main_content": page_content,
                "headings": page_data.get('headings', []),
                "paragraphs": page_data.get('paragraphs', []),
                "images": page_data.get('images', []),
                "meta_description": page_data.get('meta_description', ""),
            }]
            
            # Test rag_agent.index_content
            try:
                stats = rag_agent.index_content(pages_for_indexing)
                print(f"✅ RAG stats: {stats}")
                
                # Verify in vector store
                hits = rag_agent.search_docs("contact techify hub", top_k=5, min_similarity=0.0)
                print(f"✅ Found {len(hits)} hits in search after targeted index.")
                for hit in hits:
                     if hit.get('url') == page_data['url']:
                         print(f"   MATCH: {hit['url']} with score {hit['similarity_score']}")
            except Exception as e:
                print(f"❌ RAG Indexing failed: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("❌ main.py: is_readable_text FAILED.")
    else:
        print(f"❌ main.py: Content too short ({len(page_content)} <= {min_len})")

if __name__ == "__main__":
    asyncio.run(test_indexing())
