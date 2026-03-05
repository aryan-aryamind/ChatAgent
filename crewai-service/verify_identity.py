
import asyncio
import os
import sys
import io
from dotenv import load_dotenv

# Fix for Windows terminal emoji encoding
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Ensure we can import from the current directory
sys.path.append(os.getcwd())

from agents.synthesis_agent import SynthesisAgent
from agents.llm_agent import LLMAgent

# Load environment variables
load_dotenv()

async def verify_identity_extraction():
    # Initialize LLM Agent as in main.py
    llm_provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    if llm_provider == "xai":
        llm_agent = LLMAgent(model_name=os.getenv("XAI_MODEL", "grok-3-mini"), provider="xai", api_key=os.getenv("XAI_API_KEY"), base_url=os.getenv("XAI_BASE_URL"))
    elif llm_provider == "groq":
        llm_agent = LLMAgent(model_name=os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile"), provider="groq", api_key=os.getenv("GROQ_API_KEY"), base_url=os.getenv("GROQ_BASE_URL"))
    else:
        llm_agent = LLMAgent(model_name=os.getenv("OLLAMA_MODEL", "llama3"), provider="ollama", base_url=os.getenv("OLLAMA_URL", "http://localhost:11434"))

    agent = SynthesisAgent(llm_agent=llm_agent)
    
    # Mock Site Info (as passed by updated main.py)
    site_info = {
        "url": "https://techifyhub.in/",
        "title": "Techifyhub - Shop Gadgets, Laptops & Home Audio",
        "description": "Quality electronics and peripherals at best prices."
    }

    # Mock content dominated by product brand "Frontech"
    mock_content = """
Frontech Wired Optical Mouse. Frontech Wireless Keyboard. 
At FRONTECH we make the best products. 
Frontech official store listings.
Frontech brand history.
Welcome to our shop. We are a premier retailer of gadgets and tech.
Everything from keyboards to speakers.
"""

    print("\n--- TESTING IDENTITY EXTRACTION (ATTEMPT 2) ---")
    print(f"Official Site Info: {site_info}")
    
    summary = agent.extract_business_context(mock_content, site_info=site_info)
    
    print(f"\nEXTRACTED CONTEXT:\n{summary}")
    
    # Check if "Techify" is found instead of "Frontech" being the primary identity
    if "Techify" in summary:
        print("\n✅ SUCCESS: Correctly identified Techify Hub as the primary identity.")
    else:
        print("\n❌ FAILURE: Still confused by branding.")

if __name__ == "__main__":
    asyncio.run(verify_identity_extraction())
