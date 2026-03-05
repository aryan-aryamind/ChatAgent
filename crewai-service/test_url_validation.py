
import httpx
import json

def test_invalid_url():
    url = "http://localhost:8000/scrape"
    payload = {
        "url": "give me privcay policy",
        "max_pages": 1,
        "agent_id": "test_agent"
    }
    
    try:
        response = httpx.post(url, json=payload, timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_invalid_url()
