
import asyncio
import time
import logging
import sys
import os

# Ensure we can import from the current directory
sys.path.append(os.getcwd())

from scraper.async_website_scraper import AsyncWebsiteScraper, AsyncScrapeOptions
from rag_agent import RAGAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("speed_test")

async def test_speed():
    url = "https://techifyhub.in"
    agent_id = "speed_test_agent"
    
    # Cleanup old index to avoid dimension mismatch after model swap
    storage_dir = os.path.join(os.getcwd(), "vector_storage")
    for f in os.listdir(storage_dir):
        if f.startswith(agent_id):
            os.remove(os.path.join(storage_dir, f))
            print(f"🗑️  Cleared old index file: {f}")
    
    # Options: 100 pages for a realistic scale test
    options = AsyncScrapeOptions(
        max_pages=100,
        max_depth=5,
        concurrency=25,
        delay=0.05
    )
    
    scraper = AsyncWebsiteScraper(base_url=url, options=options)
    
    print(f"\n🚀 Phase 1: Scraping {options.max_pages} pages from {url}")
    start_time = time.time()
    
    scraped_content = await scraper.run()
    scrape_end_time = time.time()
    
    scrape_duration = scrape_end_time - start_time
    print(f"✅ Scraping finished in {scrape_duration:.2f} seconds")
    print(f"📄 Pages scraped: {len(scraped_content.pages)}")
    
    if not scraped_content.pages:
        print("❌ No pages scraped. Check terminal logs.")
        return

    print(f"\n🚀 Phase 2: Indexing into Vector Store (Batch Size: 128)")
    rag_agent = RAGAgent(agent_id=agent_id)
    
    pages = [
        {
            "url": p.url,
            "title": p.title,
            "main_content": p.main_content,
            "headings": p.headings,
            "paragraphs": p.paragraphs
        }
        for p in scraped_content.pages
    ]
    
    index_start_time = time.time()
    indexing_stats = rag_agent.index_content(pages)
    index_end_time = time.time()
    
    index_duration = index_end_time - index_start_time
    total_duration = index_end_time - start_time
    
    print(f"✅ Indexing finished in {index_duration:.2f} seconds")
    print(f"📦 Chunks indexed: {indexing_stats.get('chunks_indexed', 0)}")
    print(f"\n⏱️  TOTAL TIME: {total_duration:.2f} seconds")
    
    with open("speed_report.txt", "w", encoding="utf-8") as f:
        f.write(f"Scrape URL: {url}\n")
        f.write(f"Pages: {len(scraped_content.pages)}\n")
        f.write(f"Scrape Time: {scrape_duration:.2f}s\n")
        f.write(f"Index Time: {index_duration:.2f}s\n")
        f.write(f"Total Time: {total_duration:.2f}s\n")
        f.write(f"Chunks: {indexing_stats.get('chunks_indexed', 0)}\n")
    
    if total_duration < 40:
        print("\n✨ PERFORMANCE GOAL MET (< 40s) ✨")
    else:
        print("\n⚠️  Performance goal not met. Further optimization may be needed.")

if __name__ == "__main__":
    asyncio.run(test_speed())
