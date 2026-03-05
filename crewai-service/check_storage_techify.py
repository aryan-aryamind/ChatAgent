
import sys
import os
import json

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from content_storage import ContentStorage

def check_contact_in_storage(agent_id):
    storage = ContentStorage()
    content = storage.load_content(agent_id)
    if not content:
        print(f"❌ No content found for agent {agent_id}")
        return
    
    pages = content.get('pages', [])
    print(f"Total pages in storage for agent {agent_id}: {len(pages)}")
    
    contact_pages = [p for p in pages if "contact" in (p.get('url') or "").lower()]
    if contact_pages:
        print(f"✅ Found {len(contact_pages)} contact pages in storage.")
        for p in contact_pages:
            print(f"- URL: {p['url']}")
            print(f"  Content length: {len(p.get('content', ''))}")
    else:
        print("❌ No contact pages found in storage.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_storage.py <agent_id>")
        sys.exit(1)
    check_contact_in_storage(sys.argv[1])
