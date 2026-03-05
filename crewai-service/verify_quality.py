
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
logger = logging.getLogger("quality_verification")

async def test_response_quality():
    # Mock LLM Agent
    mock_llm = MagicMock()
    
    agent = SynthesisAgent(llm_agent=mock_llm, company_name="Techify Hub")
    
    # Test Case 1: User asks for contact details (Should NOT be generic)
    query1 = "can you share the contact details"
    # We want to see if the AI includes the actual data from the chunk
    contact_chunk = {
        "text": "Contact us at support@techifyhub.in or call +91-9876543210. Our office is in Mumbai.",
        "url": "https://techifyhub.in/contact"
    }
    
    # Mock a response that follows our NEW rules (providing the data)
    mock_llm.chat.return_value = "You can contact Techify Hub at support@techifyhub.in or call us at +91-9876543210. Our office is located in Mumbai."
    
    result1 = agent.synthesize(query1, chunks=[contact_chunk])
    print(f"\nQUERY: {query1}")
    print(f"ANSWER: {result1['answer']}")
    
    if "support@techifyhub.in" in result1['answer'] and "+91" in result1['answer']:
        print("✅ PASSED: Specific contact details provided.")
    else:
        print("❌ FAILED: Response was likely too generic.")

    # Test Case 2: User asks "wha is techify" (Detailed answer)
    query2 = "what is techify"
    about_chunk = {
        "text": "Techify is an electronics retailer specialized in Home Audio, Refurbished Laptops, and Keyboards. We offer free delivery over 499.",
        "url": "https://techifyhub.in/about"
    }
    
    # Mock a detailed response
    mock_llm.chat.return_value = "Techify is a specialized electronics retailer offering Home Audio, Refurbished Laptops, and Keyboards. We provide free delivery on all orders over ₹499."
    
    result2 = agent.synthesize(query2, chunks=[about_chunk])
    print(f"\nQUERY: {query2}")
    print(f"ANSWER: {result2['answer']}")
    
    if "Home Audio" in result2['answer'] and "Refurbished Laptops" in result2['answer']:
        print("✅ PASSED: Detailed company identity provided.")
    else:
        print("❌ FAILED: Response was too brief or generic.")

if __name__ == "__main__":
    asyncio.run(test_response_quality())
