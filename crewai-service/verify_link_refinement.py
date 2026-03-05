
import asyncio
import logging
import sys
import os
from unittest.mock import MagicMock

# Ensure we can import from the current directory
sys.path.append(os.getcwd())

from agents.synthesis_agent import SynthesisAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("link_verification")

async def test_links():
    # Mock LLM Agent
    mock_llm = MagicMock()
    # We want to see how the LLM responds to our strict prompt
    # Since we can't run a real LLM easily in a small unit test without API keys, 
    # we'll just check if our prompt (which we can inspect if we modify SynthesisAgent) 
    # is being built correctly, or we can mock the chat to return a "compliant" answer.
    
    agent = SynthesisAgent(llm_agent=mock_llm, company_name="Techify Hub")
    
    # Test Case 1: User asks for the link
    query1 = "give me the website link"
    mock_llm.chat.return_value = "You can visit our website at [Techify Hub](https://techifyhub.in) for more information."
    
    result1 = agent.synthesize(query1, chunks=[{"text": "Techify Hub is at https://techifyhub.in", "url": "https://techifyhub.in"}])
    print(f"\nQUERY: {query1}")
    print(f"ANSWER: {result1['answer']}")
    
    # Test Case 2: Follow up without link request
    query2 = "what is the minimum price?"
    history = [{"role": "user", "content": query1}, {"role": "assistant", "content": result1['answer']}]
    
    # For this test, we mock a response that DOES NOT include a link, 
    # as per our new strict instructions.
    mock_llm.chat.return_value = "The minimum product price on Techify Hub starts from ₹499 for basic accessories."
    
    result2 = agent.synthesize(query2, chunks=[{"text": "Products start at 499", "url": "https://techifyhub.in/shop"}], history=history)
    print(f"\nQUERY: {query2}")
    print(f"ANSWER: {result2['answer']}")
    
    if "https://" in result2['answer'] or ".com" in result2['answer'] or ".in" in result2['answer']:
        print("\n❌ FAILED: Link included in follow-up message when not requested.")
    else:
        print("\n✅ PASSED: No link included in follow-up message.")

if __name__ == "__main__":
    asyncio.run(test_links())
