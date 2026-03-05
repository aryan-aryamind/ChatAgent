from vector_store import VectorStore
import os
from pathlib import Path

def check_store(agent_id):
    store = VectorStore(agent_id=agent_id, index_type="docs")
    print(f"Agent ID: {store.agent_id}")
    print(f"Index Path: {store.index_path}")
    print(f"Exists? {store.index_path.exists()}")
    print(f"Metadata Path: {store.metadata_path}")
    print(f"Exists? {store.metadata_path.exists()}")
    print(f"Index is None? {store.index is None}")
    print(f"Metadata length: {len(store.metadata)}")
    
    if store.metadata:
        print(f"First 3 metadata entries:")
        for i, m in enumerate(store.metadata[:3]):
            print(f"  [{i}] URL: {m.get('url')}")
            
    # Try a simple search
    results = store.search("mouse", top_k=5)
    print(f"Search results for 'mouse': {len(results)}")
    for r in results:
        print(f" - {r.get('similarity_score'):.4f}: {r.get('text')[:100]}...")

if __name__ == "__main__":
    check_store("1772533471859")
