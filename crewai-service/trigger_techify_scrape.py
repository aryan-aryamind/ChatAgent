
import httpx
import asyncio
import json

async def trigger_scrape():
    url = "http://localhost:8000/scrape"
    payload = {
        "url": "https://techifyhub.in/",
        "agent_id": "1772523473222",
        "max_pages": 100,
        "max_depth": 10,
        "delay": 0.05
    }
    
    print(f"🚀 Triggering scrape for {payload['url']} (Max Pages: {payload['max_pages']})...")
    print("This may take a minute or two. Please wait.")
    
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            print("\n✅ Scrape response received:")
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"\n❌ Error triggering scrape: {e}")

if __name__ == "__main__":
    asyncio.run(trigger_scrape())
