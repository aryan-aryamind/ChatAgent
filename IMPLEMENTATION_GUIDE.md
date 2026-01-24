# Dual-Mode Implementation Guide

This document describes the implementation of the dual-mode system (LLM vs CrewAI) for the Chatbase Clone.

## Overview

The system now supports two response modes:
1. **LLM Mode**: Traditional AI responses using GPT, Claude, or Gemini models
2. **CrewAI Mode**: Intent-based responses using Q&A pairs

## Implementation Summary

### 1. Data Structures ✅

**Updated Files:**
- `src/contexts/AgentsContext.tsx` - Added `responseMode`, `qaPairs`, `crewaiSettings`
- `src/contexts/AgentCreationContext.tsx` - Added `QAPair` interface, `responseMode` to state

**Key Changes:**
- `Agent` interface now includes `responseMode: 'llm' | 'crewai'`
- `Source` interface supports `qaPairs: QAPair[]`
- `QAPair` interface with `id`, `question`, `answer`, `intent`

### 2. Q&A Management ✅

**Updated Files:**
- `src/app/components/agent-creation/step2-details.tsx`

**Features:**
- Enhanced Q&A dialog with ability to add multiple pairs
- Auto-generates intents from questions
- Shows Q&A pair count
- Supports adding/removing pairs

### 3. Mode Selection UI ✅

**Updated Files:**
- `src/app/components/agent-creation/step4-model.tsx` - Mode selection in agent creation
- `src/app/components/agent-builder/settings-tab.tsx` - Mode toggle in settings

**Features:**
- Radio button selection between LLM and CrewAI modes
- Conditional rendering of settings based on mode
- Shows Q&A pair count for CrewAI mode
- Intent confidence threshold slider for CrewAI

### 4. Playground Integration ✅

**Updated Files:**
- `src/app/components/agent-builder/playground-tab.tsx`
- `src/app/components/agent-builder/agent-builder.tsx`

**Features:**
- Shows current mode badge (LLM/CrewAI)
- Calls API route for chat
- Displays intent information for CrewAI responses
- Shows matched Q&A pairs
- Handles different response formats

### 5. API Routes ✅

**Created Files:**
- `pages/api/agents/[id]/chat.ts`

**Features:**
- Handles both LLM and CrewAI modes
- Simulates responses (ready for real integration)
- Returns appropriate response format based on mode

### 6. CrewAI Python Service ✅

**Created Files:**
- `crewai-service/main.py` - FastAPI server
- `crewai-service/agents/intent_classifier.py` - Intent classification
- `crewai-service/agents/qa_matcher.py` - Q&A pair matching
- `crewai-service/agents/response_generator.py` - Response generation
- `crewai-service/requirements.txt` - Python dependencies

## How to Use

### For Users (LLM Mode)

1. Create agent → Add sources (files, links, text)
2. Step 4: Select "LLM Mode"
3. Choose model (GPT-4, Claude, etc.)
4. Configure temperature, max tokens, system prompt
5. Create agent and test in Playground

### For Users (CrewAI Mode)

1. Create agent → Add Q&A pairs in Step 2
2. Step 4: Select "CrewAI Mode"
3. See Q&A pair count and configure confidence threshold
4. Create agent and test in Playground
5. System matches queries to Q&A pairs based on intent

## Setup Instructions

### Frontend (Next.js)

Already integrated! Just run:
```bash
npm install
npm run dev
```

### Backend (CrewAI Service)

1. Navigate to `crewai-service` directory:
```bash
cd crewai-service
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the service:
```bash
python main.py
```

The service will run on `http://localhost:8000`

### Connecting Frontend to CrewAI Service

Update `pages/api/agents/[id]/chat.ts` to call the CrewAI service:

```typescript
if (responseMode === 'crewai') {
  const response = await fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      qa_pairs: agent.qaPairs,
      confidence_threshold: agent.crewaiSettings?.intentConfidence || 0.8
    })
  })
  const data = await response.json()
  return res.status(200).json({
    text: data.text,
    intent: data.intent,
    confidence: data.confidence,
    matchedQAPair: data.matched_qa_pair
  })
}
```

## Features

### LLM Mode
- ✅ Multiple model support (GPT-4, Claude, Gemini)
- ✅ Temperature control
- ✅ Max tokens configuration
- ✅ Custom system prompts
- ✅ Source attribution

### CrewAI Mode
- ✅ Intent-based classification
- ✅ Q&A pair matching
- ✅ Confidence scoring
- ✅ Semantic similarity matching
- ✅ Intent threshold configuration

## Future Enhancements

1. **Real LLM Integration**: Connect to actual OpenAI/Anthropic APIs
2. **Advanced Intent Training**: Machine learning-based intent classification
3. **Hybrid Mode**: Use CrewAI for Q&A, LLM for complex queries
4. **Analytics**: Track intent usage, Q&A pair effectiveness
5. **Import/Export**: CSV/JSON import for Q&A pairs
6. **Intent Management**: User-defined intent categories

## File Structure

```
Chatbase-Clone/
├── src/
│   ├── contexts/
│   │   ├── AgentsContext.tsx (updated)
│   │   └── AgentCreationContext.tsx (updated)
│   └── app/components/
│       ├── agent-creation/
│       │   ├── step2-details.tsx (enhanced Q&A)
│       │   └── step4-model.tsx (mode selection)
│       └── agent-builder/
│           ├── playground-tab.tsx (updated)
│           ├── settings-tab.tsx (mode toggle)
│           └── agent-builder.tsx (updated)
├── pages/
│   └── api/
│       └── agents/
│           └── [id]/
│               └── chat.ts (new)
└── crewai-service/
    ├── main.py (new)
    ├── requirements.txt (new)
    └── agents/
        ├── intent_classifier.py (new)
        ├── qa_matcher.py (new)
        └── response_generator.py (new)
```

## Testing

1. **Test LLM Mode:**
   - Create agent with files/links
   - Select LLM mode
   - Test in playground

2. **Test CrewAI Mode:**
   - Create agent with Q&A pairs
   - Select CrewAI mode
   - Test queries that match Q&A pairs
   - Verify intent detection and matching

## Notes

- The API route currently uses mock responses
- CrewAI service uses sentence transformers for semantic matching
- Intent classification uses keyword matching (can be enhanced with ML)
- Q&A pairs are stored in agent context (should be persisted to database in production)
