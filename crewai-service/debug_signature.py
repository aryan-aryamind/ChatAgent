import inspect
from rag_agent import RAGAgent
import os

print(f"Current working directory: {os.getcwd()}")
print(f"Inspecting RAGAgent.answer signature:")
sig = inspect.signature(RAGAgent.answer)
print(sig)

print("\nReading main.py lines 520-540:")
with open("main.py", "r", encoding="utf-8") as f:
    lines = f.readlines()
    for i in range(520, min(540, len(lines))):
        print(f"{i+1}: {lines[i].strip()}")

print("\nSearching for any 'answer' calls with 'top_k' in main.py:")
for i, line in enumerate(lines):
    if ".answer(" in line and "top_k" in line:
        print(f"FOUND at line {i+1}: {line.strip()}")
