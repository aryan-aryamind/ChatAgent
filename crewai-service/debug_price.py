
from agents.llm_agent import LLMAgent
from agents.synthesis_agent import SynthesisAgent
import logging

logging.basicConfig(level=logging.INFO)

def test_price_grounding():
    llm = LLMAgent()
    # Mock some context about mouse that DOES NOT have a price
    chunks = [
        {
            "text": "The gaming mouse features an ergonomic design and high-precision sensor. It is available in black and white colors.",
            "url": "https://techifyhub.in/products/gaming-mouse",
            "title": "Gaming Mouse - Techify Hub"
        }
    ]
    
    agent = SynthesisAgent(llm, company_name="Techify Hub")
    
    print("\n--- Testing Price Grounding (Should NOT guess price) ---")
    response = agent.synthesize("what is the price of the gaming mouse?", chunks)
    print(f"Response: {response['answer']}")
    
    # Check if a number looking like a price is in the answer
    import re
    prices = re.findall(r'₹?\s?\d+[\d,.]*', response['answer'])
    if prices:
        print(f"❌ Hallucination detected! Found potential price(s): {prices}")
    else:
        print("✅ No price hallucination detected.")

if __name__ == "__main__":
    test_price_grounding()
