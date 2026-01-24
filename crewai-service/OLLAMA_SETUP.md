# Ollama Setup Guide

This guide will help you set up Ollama with a tiny LLM model for the hybrid semantic search + LLM system.

## What is Ollama?

Ollama is a tool that runs large language models locally on your machine. It's free, open-source, and easy to use.

## Installation Steps

### 1. Install Ollama

**Windows:**
- Download from: https://ollama.ai/download
- Run the installer
- Ollama will start automatically

**Mac:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Download a Tiny LLM Model

We recommend **Phi-3 Mini** (3.8B parameters, ~2GB):

```bash
ollama pull phi3:mini
```

**Alternative models (if you have more space):**
- `llama3:8b` - Better quality, ~4.5GB
- `mistral:7b` - Good balance, ~4.1GB
- `qwen2.5:0.5b` - Smallest, ~300MB (lower quality)

### 3. Verify Installation

Check if Ollama is running:
```bash
ollama list
```

You should see `phi3:mini` in the list.

### 4. Test Ollama

Test if it's working:
```bash
ollama run phi3:mini "Hello, how are you?"
```

### 5. Configure the Service

The service will automatically detect Ollama at `http://localhost:11434`.

You can customize the model and URL using environment variables:

```bash
# In your .env file or environment
OLLAMA_MODEL=phi3:mini
OLLAMA_URL=http://localhost:11434
```

## How It Works

1. **High Confidence (>85%)**: Direct answer from semantic search (fast, no LLM)
2. **Medium Confidence (70-85%)**: LLM refines the answer
3. **Low Confidence (<70%)**: LLM generates answer from Q&A context
4. **No Match**: LLM generates answer from all Q&A pairs

## Space Requirements

- **Phi-3 Mini**: ~2GB
- **Embedding Model**: ~80MB
- **Total**: ~2.1GB

## Performance

- **Semantic Search**: 10-50ms (most queries)
- **LLM Generation**: 1-3 seconds (only when needed)
- **LLM Refinement**: 0.5-2 seconds

## Troubleshooting

### Ollama not detected?

1. Make sure Ollama is running:
   ```bash
   ollama serve
   ```

2. Check if the model is downloaded:
   ```bash
   ollama list
   ```

3. Test the API:
   ```bash
   curl http://localhost:11434/api/tags
   ```

### Model not found?

Download the model:
```bash
ollama pull phi3:mini
```

### Slow responses?

- Use a smaller model (phi3:mini or qwen2.5:0.5b)
- Or use GPU if available (Ollama will use it automatically)

### Out of memory?

- Use a smaller model
- Close other applications
- Reduce the number of Q&A pairs sent to LLM

## Optional: Run Ollama as a Service

**Windows (using NSSM):**
```bash
nssm install Ollama "C:\path\to\ollama.exe" serve
nssm start Ollama
```

**Linux (systemd):**
Create `/etc/systemd/system/ollama.service`:
```ini
[Unit]
Description=Ollama Service
After=network.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=your-user
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

## Next Steps

1. Start your CrewAI service:
   ```bash
   cd crewai-service
   python main.py
   ```

2. The service will automatically detect Ollama and use it when needed.

3. Test with a query that has low semantic search confidence to see the LLM in action!
