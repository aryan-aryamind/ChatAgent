import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("XAI_API_KEY")
base_url = os.getenv("XAI_BASE_URL", "https://api.x.ai/v1")

headers = {
    "Authorization": f"Bearer {api_key}"
}

try:
    response = requests.get(f"{base_url}/models", headers=headers)
    if response.status_code == 200:
        models = response.json().get("data", [])
        print("Available models:")
        for m in models:
            print(f"- {m['id']}")
    else:
        print(f"Error {response.status_code}: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
