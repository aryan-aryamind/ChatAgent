
import sys
import os
import json

sys.path.append(os.getcwd())

def is_readable_text(text: str) -> bool:
    """Simulated check from main.py"""
    if not text:
        return False
    printable_ratio = sum(1 for c in text[:1000] if c.isprintable() or c.isspace()) / min(len(text), 1000)
    non_ascii_ratio = sum(1 for c in text[:1000] if ord(c) > 127) / min(len(text), 1000)
    return printable_ratio > 0.7 and non_ascii_ratio < 0.5

# Test with actual contact page content
contact_json_path = "d:/Chatbase-Clone/crewai-service/content_storage/techifyhub_in_contact.json"
with open(contact_json_path, 'r', encoding='utf-8') as f:
    page_data = json.load(f)

page_content = page_data.get('main_content', '')
page_url = page_data.get('url', '')

print(f"URL: {page_url}")
print(f"Content length: {len(page_content.strip())}")
print(f"Content repr (first 200): {repr(page_content[:200])}")
print()

# Run all filter checks
page_url_lower = (page_url or "").lower().rstrip('/')
is_info_page = any(w in page_url_lower for w in ["contact", "about", "support", "headquarter", "location"])
min_len = 15 if is_info_page else 50
passes_length = page_content and len(page_content.strip()) > min_len
passes_readable = is_readable_text(page_content) if passes_length else False

printable_ratio = sum(1 for c in page_content[:1000] if c.isprintable() or c.isspace()) / max(1, min(len(page_content), 1000))
non_ascii_ratio = sum(1 for c in page_content[:1000] if ord(c) > 127) / max(1, min(len(page_content), 1000))

print(f"is_info_page: {is_info_page}")
print(f"min_len: {min_len}")
print(f"passes_length ({len(page_content.strip())} > {min_len}): {passes_length}")
print(f"printable_ratio: {printable_ratio:.2f} (need > 0.7)")
print(f"non_ascii_ratio: {non_ascii_ratio:.2f} (need < 0.5)")
print(f"passes_readable: {passes_readable}")
print()

if passes_length and passes_readable:
    print("✅ Contact page SHOULD be indexed - filter passes")
else:
    print("❌ Contact page is BLOCKED by filter")
    if not passes_length:
        print(f"  - Length check failed: {len(page_content.strip())} <= {min_len}")
    if not passes_readable:
        print(f"  - Readability check failed: printable={printable_ratio:.2f}, non_ascii={non_ascii_ratio:.2f}")
