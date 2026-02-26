import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'crewai-service'))

from rag_agent import RAGAgent

def test_priority():
    print("Testing RAG Priority Logic...")
    
    agent = RAGAgent(agent_id="test_agent")
    
    # Mock data
    qa_pairs = [
        {"question": "What is MedTrust?", "answer": "MedTrust is a healthcare talent platform.", "intent": "general"}
    ]
    
    scraped_chunks = [
        {"text": "Job listings at MedTrust include Nurses, Doctors, and Technicians at Apollo Hospital.", "url": "https://medtrust.com/jobs", "title": "Jobs"}
    ]
    
    # Injected manual Q&A search result (since we can't easily mock the vector store's actual search results here without deeper mocking)
    # But we can verify the 'answer' method's logic if we mock the search results internally or just test the synthesis logic.
    
    print("\n--- TEST: Direct Q&A Match ---")
    query = "What is MedTrust?"
    
    # We'll mock the 'search' method to return the scraped chunk with high similarity
    # and verify if the manual Q&A (which will be found via qa_matcher) wins.
    
    original_search = agent.search
    agent.search = lambda q, top_k, min_similarity: [{
        'text': "Job listings at MedTrust include Nurses, Doctors, and Technicians at Apollo Hospital.",
        'url': "https://medtrust.com/jobs",
        'title': "Jobs",
        'similarity_score': 0.8 # High similarity for scraped content
    }]
    
    # Run the answer method
    result = agent.answer(query, qa_pairs=qa_pairs)
    
    print(f"Query: {query}")
    print(f"Result Answer: {result['answer']}")
    print(f"Confidence: {result['confidence']}")
    print(f"Source: {result['sources'][0]['url'] if result['sources'] else 'None'}")
    
    if "healthcare talent platform" in result['answer'] and "Based on our content" not in result['answer']:
        print("✅ SUCCESS: Manual Q&A prioritized correctly.")
    else:
        print("❌ FAILURE: Manual Q&A not prioritized or has prefix.")

if __name__ == "__main__":
    test_priority()
