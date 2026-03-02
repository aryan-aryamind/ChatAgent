import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY", "").strip()
print(f"DEBUG: Key length: {len(api_key)}")
if api_key:
    print(f"DEBUG: Key starts with: {api_key[:10]}...")
# Test Groq base URL
base_url = "https://api.groq.com/openai/v1"

headers = {
    "Authorization": f"Bearer {api_key}"
}

try:
    response = requests.get(f"{base_url}/models", headers=headers)
    if response.status_code == 200:
        models = response.json().get("data", [])
        print("Success! This is a valid Groq key.")
        model_ids = [m['id'] for m in models]
        print(f"Total models available: {len(model_ids)}")
        
        target_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        if target_model in model_ids:
            print(f"✅ Model '{target_model}' IS available.")
        else:
            print(f"❌ Model '{target_model}' is NOT in the list.")
            print("Top available models:")
            for m_id in model_ids[:15]:
                print(f"- {m_id}")
    else:
        print(f"Error {response.status_code}: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
