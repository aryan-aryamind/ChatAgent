import json

AGENT_ID = "1772427103966"

with open(f"content_storage/{AGENT_ID}.json", encoding="utf-8") as f:
    d = json.load(f)

print("=== SCRAPE STATS ===")
print(json.dumps(d.get("stats", {}), indent=2))

pages = d.get("pages", [])
print(f"\n=== PAGES SCRAPED: {len(pages)} total ===")
for i, p in enumerate(pages):
    url = p.get("url", "?")
    content_len = len(p.get("content", ""))
    paragraphs = len(p.get("paragraphs", []))
    print(f"  [{i+1}] {url}")
    print(f"       Content: {content_len} chars | Paragraphs: {paragraphs}")

print(f"\n=== FULL CONTENT LENGTH ===")
print(f"{len(d.get('full_content', ''))} chars")

print(f"\n=== BUSINESS CONTEXT ===")
print(d.get("business_context", "(none)"))

# Check vector store
import os
docs_meta = f"vector_storage/{AGENT_ID}_docs_metadata.json"
if os.path.exists(docs_meta):
    with open(docs_meta, encoding="utf-8") as f:
        meta = json.load(f)
    print(f"\n=== VECTOR INDEX: {len(meta)} chunks ===")
    urls_seen = {}
    for chunk in meta:
        url = chunk.get("url", "?")
        urls_seen[url] = urls_seen.get(url, 0) + 1
    for url, count in urls_seen.items():
        print(f"  {count} chunks  <-  {url}")
else:
    print("\n=== No docs vector index found ===")
