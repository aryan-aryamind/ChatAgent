import sys
import os
sys.path.append(os.getcwd())

from agents.synthesis_agent import SynthesisAgent

try:
    print("Testing SynthesisAgent...")
    agent = SynthesisAgent(llm_agent=None)
    print("Class BASE_PROMPT:")
    print(SynthesisAgent.BASE_PROMPT)
    print("\nCalling get_persona_prompt('general')...")
    result = agent.get_persona_prompt("general")
    print("SUCCESS!")
    print("Result snippet:", result[:100] + "...")
except Exception as e:
    print(f"FAILED with error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
