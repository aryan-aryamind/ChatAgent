"""
Example usage of the RAG system with vector store.
Demonstrates the complete pipeline from scraping to answering.
"""

import asyncio
from rag_agent import RAGAgent
from agents.llm_agent import LLMAgent
from scraper.async_website_scraper import AsyncWebsiteScraper, AsyncScrapeOptions


async def example_complete_rag_flow():
    """
    Complete example: Scrape → Index → Answer
    """
    agent_id = "example-agent-123"
    
    # Step 1: Scrape website
    print("Step 1: Scraping website...")
    scraper = AsyncWebsiteScraper(
        base_url="https://example.com",
        options=AsyncScrapeOptions(
            max_pages=10,
            max_depth=2,
            concurrency=3
        )
    )
    
    scraped_content = await scraper.run()
    print(f"✅ Scraped {scraped_content.total_pages} pages")
    
    # Step 2: Initialize RAG agent
    print("\nStep 2: Initializing RAG agent...")
    llm_agent = LLMAgent()
    rag_agent = RAGAgent(
        agent_id=agent_id,
        llm_agent=llm_agent,
        chunk_size=400
    )
    
    # Step 3: Index content into vector store
    print("\nStep 3: Indexing content into vector store...")
    indexing_stats = rag_agent.index_content(scraped_content.pages)
    print(f"✅ Indexed {indexing_stats['chunks_indexed']} chunks")
    
    # Step 4: Answer questions
    print("\nStep 4: Answering questions...")
    
    questions = [
        "What is this website about?",
        "What services do you offer?",
        "How can I contact you?",
    ]
    
    for question in questions:
        print(f"\n❓ Question: {question}")
        result = rag_agent.answer(
            query=question
        )
        
        print(f"✅ Answer: {result['answer']}")
        print(f"📊 Confidence: {result['confidence']}%")
        print(f"🔗 Sources: {len(result['sources'])}")
        for source in result['sources'][:2]:
            print(f"   - {source['title']} ({source['relevance']:.2f})")


async def example_direct_usage():
    """
    Example of using RAG agent directly (when content is already indexed).
    """
    agent_id = "example-agent-123"
    
    # Initialize RAG agent (loads existing vector store)
    rag_agent = RAGAgent(agent_id=agent_id)
    
    # Check if vector store exists
    stats = rag_agent.get_stats()
    if not stats['vector_store']['index_exists']:
        print("❌ Vector store not found. Please index content first.")
        return
    
    # Search for relevant chunks
    query = "What is your pricing?"
    print(f"🔍 Searching for: '{query}'")
    
    chunks = rag_agent.search(
        query=query,
        top_k=5,
        min_similarity=0.3
    )
    
    print(f"✅ Found {len(chunks)} relevant chunks:")
    for i, chunk in enumerate(chunks, 1):
        print(f"{i}. {chunk['title']} (similarity: {chunk['similarity_score']:.2f})")
        print(f"   {chunk['text'][:100]}...")
    
    # Generate answer
    print(f"\n🤖 Generating answer...")
    result = rag_agent.answer(
        query=query
    )
    
    print(f"✅ Answer: {result['answer']}")
    print(f"📊 Confidence: {result['confidence']}%")
    print(f"🔗 Sources: {len(result['sources'])}")


if __name__ == "__main__":
    # Run complete flow example
    print("=" * 60)
    print("Complete RAG Flow Example")
    print("=" * 60)
    asyncio.run(example_complete_rag_flow())
    
    print("\n" + "=" * 60)
    print("Direct Usage Example")
    print("=" * 60)
    asyncio.run(example_direct_usage())
