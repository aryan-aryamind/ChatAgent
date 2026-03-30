import sys
import os
from unittest.mock import MagicMock

# Add current directory to path to import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag_agent import RAGAgent

def test_company_name_inference():
    print("Testing company name inference...")
    
    # Test case 1: Technical ID (CUID)
    cuid = "Cmn8s1vmk0008ebdonymjfw2e"
    agent = RAGAgent(agent_id=cuid)
    print(f"Agent ID: {cuid}")
    print(f"Inferred Company Name: {agent.company_name}")
    assert agent.company_name == "the company", f"Expected 'the company', got '{agent.company_name}'"
    
    # Test case 2: Readable ID
    readable_id = "SanjayPortfolio"
    agent2 = RAGAgent(agent_id=readable_id)
    print(f"Agent ID: {readable_id}")
    print(f"Inferred Company Name: {agent2.company_name}")
    assert agent2.company_name == "Sanjayportfolio", f"Expected 'Sanjayportfolio', got '{agent2.company_name}'"
    
    print("✅ Company name inference tests passed!")

def test_answer_with_company_name_override():
    print("\nTesting answer with company name override...")
    
    cuid = "Cmn8s1vmk0008ebdonymjfw2e"
    mock_llm = MagicMock()
    mock_llm.chat.return_value = "Mocked LLM Answer"
    
    agent = RAGAgent(agent_id=cuid, llm_agent=mock_llm)
    
    # Mocking necessary parts to avoid real vector search
    agent.classifier.classify = MagicMock(return_value={'intent': 'general', 'confidence': 0.9})
    agent.search_faq = MagicMock(return_value=[])
    agent.search_docs = MagicMock(return_value=[])
    agent._recontextualization = MagicMock(side_effect=lambda q, h, cn: q)
    
    # Test override with history to trigger recontextualization
    history = [{"role": "user", "content": "hello"}]
    agent.answer(query="what is this portfolio", history=history, company_name="Sanjay Portfolio")
    
    # Let's check the recontextualization call which we mocked
    agent._recontextualization.assert_called_with("what is this portfolio", history, "Sanjay Portfolio")
    print("✅ Recontextualization received correct company_name!")
    
    print("✅ Answer override tests passed!")

if __name__ == "__main__":
    try:
        # We need to mock some environment variables or ensure paths exist
        # to avoid errors during RAGAgent initialization
        os.environ["DISABLE_RERANKER"] = "true"
        
        test_company_name_inference()
        test_answer_with_company_name_override()
        print("\n🎉 All verification tests passed successfully!")
    except Exception as e:
        print(f"\n❌ Verification failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
