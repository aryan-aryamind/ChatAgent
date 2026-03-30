import re

def _infer_company_name(agent_id, base_company_info=""):
    """Copied logic from rag_agent.py for isolated testing"""
    if base_company_info:
        if "https://" in base_company_info:
            match = re.search(r'https?://([^/]+)', base_company_info)
            if match:
                domain = match.group(1).replace("www.", "")
                return domain.split('.')[0].capitalize()

    if agent_id:
        aid = str(agent_id)
        # Filter technical IDs: digits, temp_, agent_, or long random strings
        is_technical = (
            aid.isdigit() or 
            aid.startswith(('temp_', 'agent_', 'bot_')) or
            len(aid) >= 25 or  # CUIDs are typically 25 chars
            "aHR0" in aid # Base64 'http' marker
        )
        if not is_technical:
            return aid.capitalize()
    
    return "the company"

def test():
    # Test cases
    test_cases = [
        ("Cmn8s1vmk0008ebdonymjfw2e", "the company"), # Technical CUID
        ("SanjayPortfolio", "Sanjayportfolio"),         # Readable ID
        ("temp_123", "the company"),                  # temp prefix
        ("agent_456", "the company"),                 # agent prefix
    ]
    
    for aid, expected in test_cases:
        result = _infer_company_name(aid)
        print(f"ID: {aid} -> Result: {result} (Expected: {expected})")
        assert result == expected

    print("✅ Isolated ID detection tests passed!")

if __name__ == "__main__":
    test()
