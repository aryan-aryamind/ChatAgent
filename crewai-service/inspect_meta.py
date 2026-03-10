import json
from pathlib import Path

def inspect_meta(agent_id, index_type="docs"):
    meta_path = Path("D:/Chatbase-Clone/crewai-service/vector_storage") / f"{agent_id}_{index_type}_metadata.json"
    if not meta_path.exists():
        print(f"Meta file not found: {meta_path}")
        return

    with open(meta_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Total chunks: {len(data)}")
    keywords = ["ahmedabad", "address", "contact", "+91", "shweta", "india", "prahladnagar"]
    found = 0
    for i, chunk in enumerate(data):
        text = chunk.get('text', '').lower()
        if any(k in text for k in keywords):
            print(f"\n--- Chunk {i} ---")
            print(f"Text: {chunk.get('text', '')}")
            print(f"URL: {chunk.get('url', 'N/A')}")
            found += 1
            if found >= 20: break
    if found == 0:
        print("No chunks found matching keywords.")

inspect_meta("cmmiq6ejv0001fd62tyjm291a")
