# CrewAI Service

This is the Python service that handles CrewAI-based intent matching and Q&A responses.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
python main.py
```

The service will run on `http://localhost:8016`

## API Endpoints

### POST /chat
Process a user message and return intent-based response.

**Request:**
```json
{
  "message": "What are your business hours?",
  "qa_pairs": [
    {
      "id": "1",
      "question": "What are your business hours?",
      "answer": "We're open Monday-Friday, 9 AM to 6 PM EST",
      "intent": "business_hours"
    }
  ]
}
```

**Response:**
```json
{
  "text": "We're open Monday-Friday, 9 AM to 6 PM EST",
  "intent": "business_hours",
  "confidence": 95,
  "matched_qa_pair": {
    "question": "What are your business hours?",
    "answer": "We're open Monday-Friday, 9 AM to 6 PM EST"
  }
}
```

## Architecture

- **Intent Classifier Agent**: Classifies user queries into intents
- **Q&A Matcher Agent**: Finds best matching Q&A pair using semantic search
- **Response Generator Agent**: Generates natural response from matched Q&A
- **LLM Agent** (Optional): Uses local Ollama LLM for low-confidence queries

## LLM Integration (Hybrid Mode)

The service now supports a hybrid approach:
- **High Confidence (>85%)**: Direct answer from semantic search (fast, no LLM)
- **Medium Confidence (70-85%)**: LLM refines the answer
- **Low Confidence (<70%)**: LLM generates answer from Q&A context
- **No Match**: LLM generates answer from all Q&A pairs

### Setup Ollama (Optional but Recommended)

See [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) for detailed setup instructions.

Quick setup:
```bash
# Install Ollama from https://ollama.ai
# Download a tiny model:
ollama pull phi3:mini

# The service will automatically detect and use it
```

The service works even without Ollama - it will fall back to direct answers.