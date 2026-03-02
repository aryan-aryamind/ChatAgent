import json
from pathlib import Path

def check_content(agent_id):
    path = Path(f'content_storage/{agent_id}.json')
    if not path.exists():
        print(f"File {path} not found")
        return
    
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        pages = data.get('pages', [])
    
    print(f"Total pages: {len(pages)}")
    keywords = ['signup', 'sign-up', 'sign up', 'login', 'fee', 'price', 'charge', 'cost', 'pay']
    
    found_any = False
    for page in pages:
        text = page.get('content', '').lower()
        url = page.get('url', '')
        
        matches = [k for k in keywords if k in text]
        if matches:
            found_any = True
            print(f"\n--- MATCH FOUND: {url} ---")
            print(f"Keywords: {', '.join(matches)}")
            # Print a snippet around the first keyword found
            first_k = matches[0]
            start_idx = max(0, text.find(first_k) - 200)
            end_idx = min(len(text), text.find(first_k) + 400)
            print(f"Snippet: {text[start_idx:end_idx]}...")

    if not found_any:
        print("No matches found for keywords.")

if __name__ == "__main__":
    check_content('1772430249678')
