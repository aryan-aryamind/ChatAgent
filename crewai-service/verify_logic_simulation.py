import asyncio
from agents.synthesis_agent import SynthesisAgent
from agents.llm_agent import LLMAgent
import sys
import io

# Force UTF-8 for Windows terminal
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def verify():
    llm = LLMAgent(model_name="phi3:mini")
    # Use actual SynthesisAgent logic with mock chunks to verify grounding/persona
    agent = SynthesisAgent(llm_agent=llm, company_name="Techify Hub")
    
    # 1. Test "Detailed Categorized Responses" (Keyboard query)
    print("\n--- TEST 1: Detailed Categorized Responses ---")
    keyboard_query = "which keyboards do you have"
    keyboard_chunks = [
        {
            "text": "FRONTECH Wired Gaming Combo Keyboard and Mouse. Features: Backlit keys, ergonomic design, USB connectivity. Price: ₹ 1,200.00",
            "url": "https://techifyhub.in/product/gaming-keyboard",
            "title": "Frontech Gaming Keyboard"
        },
        {
            "text": "Frontech KB-0033 Wired Keyboard. Membrane keys, 1 year warranty, USB Plug & Play. Price: ₹ 450.00",
            "url": "https://techifyhub.in/product/kb-0033",
            "title": "Frontech KB-0033"
        },
        {
            "text": "Wireless Bluetooth Keyboards available in various models. Connect via USB receiver or Bluetooth. Categories: Office, Gaming, Standard.",
            "url": "https://techifyhub.in/category/keyboards",
            "title": "Keyboard Catalog"
        }
    ]
    
    result1 = agent.synthesize(keyboard_query, keyboard_chunks)
    print(f"QUERY: {keyboard_query}")
    print(f"ANSWER:\n{result1['answer']}")

    # 2. Test "Strict Price Grounding" (Mouse price query)
    print("\n--- TEST 2: Strict Price Grounding (No Hallucination) ---")
    # Provide context with a price for a DRIVE, and a mention of a MOUSE without price.
    mouse_query = "What is the price of the Frontech Gaming Mouse?"
    mouse_chunks = [
        {
            "text": "HP 256GB USB 3.2 Flash Drive 796W. Price: ₹ 1,865.00",
            "url": "https://techifyhub.in/product/hp-flash-drive",
            "title": "HP 256GB Flash Drive"
        },
        {
            "text": "Frontech Wired Gaming Mouse. Features high-precision sensor, 6 buttons, and RGB lighting. Part of the gaming collection.",
            "url": "https://techifyhub.in/product/gaming-mouse",
            "title": "Frontech Gaming Mouse"
        }
    ]
    
    result2 = agent.synthesize(mouse_query, mouse_chunks)
    print(f"QUERY: {mouse_query}")
    print(f"ANSWER:\n{result2['answer']}")

if __name__ == "__main__":
    asyncio.run(verify())
