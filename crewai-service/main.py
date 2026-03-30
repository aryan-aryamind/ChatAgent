import sys
import io

# Fix for Windows terminal emoji encoding
if sys.platform == "win32":
    # Set default encoding to UTF-8
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

from fastapi import FastAPI, HTTPException, UploadFile, File as FastAPIFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import logging
import PyPDF2
from agents.intent_classifier import IntentClassifierAgent
from agents.qa_matcher import QAMatcherAgent
from agents.response_generator import ResponseGeneratorAgent
from agents.llm_agent import LLMAgent
from agents.content_retriever import ContentRetrieverAgent
from scraper import (
    WebsiteScraper,
    AsyncWebsiteScraper,
    ScrapeOptions,
    AsyncScrapeOptions,
)
from content_storage import ContentStorage
from rag_agent import RAGAgent
from agents.synthesis_agent import SynthesisAgent
import os
from dotenv import load_dotenv
import random
from datetime import datetime
from urllib.parse import urlparse
import logging

# Configure logging to suppress debug logs from third-party libraries
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Suppress debug logs from noisy third-party libraries
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("faiss").setLevel(logging.WARNING)
logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
logging.getLogger("asyncio").setLevel(logging.WARNING)
logging.getLogger("transformers").setLevel(logging.WARNING)
logging.getLogger("huggingface_hub").setLevel(logging.WARNING)

app = FastAPI(title="CrewAI Chat Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QAPair(BaseModel):
    id: str
    question: str
    answer: str
    intent: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    qa_pairs: List[QAPair]
    confidence_threshold: float = 0.8


class ChatResponse(BaseModel):
    text: str
    intent: str
    confidence: int
    matched_qa_pair: Optional[dict] = None


class UpdateSettingsRequest(BaseModel):
    agent_id: str
    persona_type: str
    system_prompt: Optional[str] = None


class ScrapeRequest(BaseModel):
    url: str
    agent_id: Optional[str] = None  # Agent ID to store content
    max_pages: Optional[int] = 100  # Increased default
    max_depth: Optional[int] = 5  # Increased default
    follow_external: Optional[bool] = False
    respect_robots: Optional[bool] = True
    delay: Optional[float] = 0.05
    persona_type: Optional[str] = "general"


class ScrapeResponse(BaseModel):
    success: bool
    data: dict


class ContentChatRequest(BaseModel):
    message: str
    agent_id: str
    confidence_threshold: float = 0.3
    qa_pairs: Optional[List[QAPair]] = None
    history: Optional[List[Dict[str, str]]] = None
    persona_type: Optional[str] = "general"
    system_prompt: Optional[str] = None
    company_name: Optional[str] = None


class ContentChatResponse(BaseModel):
    text: str
    intent: str
    confidence: int
    sources: List[Dict[str, Any]] = []


# Load environment variables
load_dotenv()

# Initialize agents
intent_classifier = IntentClassifierAgent()
qa_matcher = QAMatcherAgent()
response_generator = ResponseGeneratorAgent()
content_retriever = ContentRetrieverAgent()

# Initialize LLM agent
llm_provider = os.getenv("LLM_PROVIDER", "ollama").lower()

if llm_provider == "xai":
    llm_model = os.getenv("XAI_MODEL", "grok-3-mini")
    api_key = os.getenv("XAI_API_KEY")
    base_url = os.getenv("XAI_BASE_URL", "https://api.x.ai/v1")
    print(f"🚀 Initializing LLM Agent with Cloud Provider: xAI (Model: {llm_model})")
    llm_agent = LLMAgent(
        model_name=llm_model, provider="xai", api_key=api_key, base_url=base_url
    )
elif llm_provider == "groq":
    llm_model = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
    api_key = os.getenv("GROQ_API_KEY")
    base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    print(f"🚀 Initializing LLM Agent with Cloud Provider: Groq (Model: {llm_model})")
    llm_agent = LLMAgent(
        model_name=llm_model, provider="groq", api_key=api_key, base_url=base_url
    )
else:
    llm_model = os.getenv("OLLAMA_MODEL", "llama3")
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    print(f"🚀 Initializing LLM Agent with Local Provider: Ollama (Model: {llm_model})")
    llm_agent = LLMAgent(model_name=llm_model, provider="ollama", base_url=ollama_url)

# Initialize content storage
content_storage = ContentStorage()

# RAG Agent Registry (Cache to avoid re-init)
rag_agent_registry = {}


def get_rag_agent(
    agent_id: str, base_company_info: str = "", persona_type: str = "general"
) -> RAGAgent:
    """Get or create a RAG agent instance from cache"""
    if agent_id not in rag_agent_registry:
        print(
            f"🆕 Initializing new RAG Agent for: {agent_id} (Persona: {persona_type})"
        )
        rag_agent_registry[agent_id] = RAGAgent(
            agent_id=agent_id,
            llm_agent=llm_agent,
            base_company_info=base_company_info,
            persona_type=persona_type,
        )
    else:
        # Update existing agent's persona if it changed
        rag_agent_registry[agent_id].set_persona(persona_type)

    return rag_agent_registry[agent_id]


# Confidence thresholds
MIN_KB_CONFIDENCE = 0.2
LLM_LOW_CONFIDENCE_THRESHOLD = 0.7
LLM_REFINE_THRESHOLD = 0.85


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        qa_pairs_dict = [qa.model_dump() for qa in request.qa_pairs]
        valid_qa_pairs = [
            qa for qa in qa_pairs_dict if qa.get("question") and qa.get("answer")
        ]
        qa_pairs_dict = valid_qa_pairs

        message_lower = request.message.lower().strip()
        greetings = [
            "hey",
            "hi",
            "hello",
            "good morning",
            "good afternoon",
            "good evening",
            "greetings",
            "howdy",
            "sup",
            "what's up",
        ]
        casual_conversation = [
            "how are you",
            "how's it going",
            "what's going on",
            "how do you do",
            "nice to meet you",
            "thanks",
            "thank you",
            "bye",
            "goodbye",
            "see you",
        ]
        question_words = [
            "what",
            "when",
            "where",
            "who",
            "why",
            "how",
            "which",
            "can",
            "could",
            "would",
            "should",
            "is",
            "are",
            "do",
            "does",
            "did",
        ]

        is_greeting = any(
            g == message_lower
            or message_lower.startswith(g + " ")
            or message_lower.endswith(" " + g)
            for g in greetings
        )
        is_casual = any(c in message_lower for c in casual_conversation)
        has_question = any(
            " " + q + " " in message_lower
            or message_lower.startswith(q + " ")
            or message_lower.endswith(" " + q)
            for q in question_words
        )

        # Simplified greeting response (no company extractor)
        if (is_greeting or is_casual) and not has_question:
            greeting_responses = [
                "Hello! How can I help you?",
                "Hi there!",
                "Hello!",
                "Hi!",
            ]
            casual_responses = [
                "I'm doing well, thank you!",
                "You're welcome!",
                "Thanks!",
                "Thank you!",
            ]
            response_text = (
                random.choice(greeting_responses)
                if is_greeting
                else random.choice(casual_responses)
            )
            intent_type = "greeting" if is_greeting else "casual"

            return ChatResponse(
                text=response_text,
                intent=intent_type,
                confidence=95 if is_greeting else 90,
                matched_qa_pair=None,
            )

        # Call RAG agent directly (UNIFIED FLOW)
        # Try to get company info from stored content for 'general' agent
        content_data = content_storage.load_content("general")
        base_url = content_data.get("base_url", "") if content_data else ""
        base_company_info = (
            f"This is an AI support assistant for {base_url}"
            if base_url
            else "This is an AI support assistant."
        )

        # Use registry to avoid memory leaks
        rag_agent = get_rag_agent("general", base_company_info)

        result = rag_agent.answer(query=request.message, qa_pairs=qa_pairs_dict)

        return ChatResponse(
            text=result["answer"],
            intent=result["intent"],
            confidence=result["confidence"],
            matched_qa_pair=None,  # Metadata can be added here if frontend needs it
        )

    except Exception as e:
        import traceback

        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error in /chat endpoint: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))


async def _chat_with_content_fallback(
    request: ContentChatRequest,
) -> ContentChatResponse:
    """
    Fallback method using old content storage (for backward compatibility).
    """
    # Load stored content
    content_data = content_storage.load_content(request.agent_id)
    if not content_data:
        # Check if it's a greeting - provide friendly response even without content
        message_lower = request.message.lower().strip()
        greetings = [
            "hey",
            "hi",
            "hello",
            "good morning",
            "good afternoon",
            "good evening",
            "greetings",
            "howdy",
            "sup",
            "what's up",
        ]
        is_greeting = any(
            g == message_lower
            or message_lower.startswith(g + " ")
            or message_lower.endswith(" " + g)
            for g in greetings
        )

        if is_greeting:
            return ContentChatResponse(
                text="Hi! How can I help you today? 😊",
                intent="greeting",
                confidence=95,
                sources=[],
            )

        # Try to use LLM to provide a helpful response even without content
        try:
            # Build context from QA pairs if available for hybrid search
            relevant_qa_context = ""
            top_qa_pairs = []
            if request.qa_pairs:
                qa_dict = [
                    qa.model_dump() if hasattr(qa, "model_dump") else qa
                    for qa in request.qa_pairs
                ]
                match_result = qa_matcher.find_match(
                    request.message, qa_dict, intent="general", top_k=3
                )
                if match_result and match_result.get("confidence", 0) > 0.4:
                    top_qa_pairs = match_result.get("top_matches", [])
                    relevant_qa_context = "Manual Q&A Info:\n" + "\n".join(
                        [f"Q: {q['question']}\nA: {q['answer']}" for q in top_qa_pairs]
                    )

            # Use LLM to generate a response using the QA context if we have it
            context = f"You are a helpful assistant. Provide a polite, friendly response. {relevant_qa_context}"

            llm_response = llm_agent.generate_answer(
                user_query=request.message, top_qa_pairs=top_qa_pairs, context=context
            )

            # If LLM gives a good response, use it
            if llm_response and len(llm_response.strip()) > 20:
                # If we matched a Q&A pair, use a higher confidence
                confidence = 85 if relevant_qa_context else 30
                return ContentChatResponse(
                    text=llm_response,
                    intent="content_based" if relevant_qa_context else "general",
                    confidence=confidence,
                    sources=(
                        [
                            {
                                "title": "Knowledge Base",
                                "url": "Manual Q&A",
                                "relevance": 0.9,
                            }
                        ]
                        if relevant_qa_context
                        else []
                    ),
                )
        except Exception as e:
            print(f"⚠️  LLM fallback failed: {e}")

        # Final fallback: user-friendly message
        return ContentChatResponse(
            text="I'm here to help! However, I don't have specific information about that topic yet. Could you please provide more details or try asking in a different way?",
            intent="no_content",
            confidence=0,
            sources=[],
        )

    # Get content chunks
    content_chunks = content_storage.get_content_chunks(
        request.agent_id, chunk_size=1000
    )

    if not content_chunks:
        # Try LLM fallback
        try:
            llm_response = llm_agent.generate_answer(
                user_query=request.message,
                top_qa_pairs=[],
                context="You are a helpful assistant. The user is asking a question, but you don't have specific information about their query yet. Provide a polite, friendly response.",
            )
            if llm_response and len(llm_response.strip()) > 20:
                return ContentChatResponse(
                    text=llm_response, intent="general", confidence=30, sources=[]
                )
        except Exception:
            pass

        return ContentChatResponse(
            text="I'm here to help! However, I don't have specific information about that topic yet. Could you please rephrase your question or provide more context?",
            intent="no_content",
            confidence=0,
            sources=[],
        )

    # Find relevant chunks using semantic search
    relevant_chunks = content_retriever.find_relevant_chunks(
        request.message, content_chunks, top_k=3
    )

    if (
        not relevant_chunks
        or relevant_chunks[0].get("similarity_score", 0) < request.confidence_threshold
    ):
        # Try LLM fallback with available content + manual Q&A pairs
        try:
            # Also search manual Q&A pairs for hybrid fallback
            relevant_qa_context = ""
            top_qa_pairs = []
            if request.qa_pairs:
                qa_dict = [
                    qa.model_dump() if hasattr(qa, "model_dump") else qa
                    for qa in request.qa_pairs
                ]
                match_result = qa_matcher.find_match(
                    request.message, qa_dict, intent="general", top_k=3
                )
                if match_result and match_result.get("confidence", 0) > 0.4:
                    top_qa_pairs = match_result.get("top_matches", [])
                    relevant_qa_context = "Manual Q&A Info:\n" + "\n".join(
                        [f"Q: {q['question']}\nA: {q['answer']}" for q in top_qa_pairs]
                    )

            # Use all chunks as context even if similarity is low, plus Q&A pairs
            context_text = "\n\n".join(
                [
                    f"{chunk.get('text', '')[:300]}"
                    for chunk in content_chunks[:5]  # Use top 5 chunks
                ]
            )

            full_context = f"{context_text}\n\n{relevant_qa_context}"

            if full_context.strip():
                llm_response = llm_agent.generate_answer_from_content(
                    user_query=request.message, context=full_context
                )
                if llm_response and len(llm_response.strip()) > 20:
                    # Determine which chunks to use for sources
                    chunks_to_use = (
                        relevant_chunks[:3] if relevant_chunks else content_chunks[:1]
                    )
                    sources = [
                        {
                            "url": chunk.get("url", ""),
                            "title": chunk.get("title", ""),
                            "relevance": (
                                chunk.get("similarity_score", 0)
                                if chunk.get("similarity_score")
                                else 0.3
                            ),
                        }
                        for chunk in chunks_to_use
                    ]

                    if relevant_qa_context:
                        sources.append(
                            {
                                "title": "Knowledge Base",
                                "url": "Manual Q&A",
                                "relevance": 0.8,
                            }
                        )

                    return ContentChatResponse(
                        text=llm_response,
                        intent="content_based",
                        confidence=85 if relevant_qa_context else 40,
                        sources=sources,
                    )
        except Exception as e:
            print(f"⚠️  LLM fallback failed: {e}")

        return ContentChatResponse(
            text="I couldn't find specific information about that in my knowledge base. Could you try rephrasing your question or asking about something else?",
            intent="no_match",
            confidence=0,
            sources=[],
        )

    # Build context from relevant chunks
    context = "\n\n".join(
        [
            f"From {chunk.get('title', 'Unknown')} ({chunk.get('url', '')}):\n{chunk.get('text', '')[:500]}"
            for chunk in relevant_chunks
        ]
    )

    # Generate answer using LLM with context
    try:
        answer = llm_agent.generate_answer_from_content(
            user_query=request.message, context=context
        )

        # Calculate confidence from similarity scores
        avg_confidence = sum(
            chunk.get("similarity_score", 0) for chunk in relevant_chunks
        ) / len(relevant_chunks)
        confidence_percent = int(min(avg_confidence * 100, 100))

        # Prepare sources
        sources = [
            {
                "url": chunk.get("url", ""),
                "title": chunk.get("title", ""),
                "relevance": chunk.get("similarity_score", 0),
            }
            for chunk in relevant_chunks
        ]

        return ContentChatResponse(
            text=answer,
            intent="content_based",
            confidence=confidence_percent,
            sources=sources,
        )

    except Exception as e:
        print(f"⚠️  LLM error, using direct content: {e}")
        # Fallback: use the most relevant chunk directly
        best_chunk = relevant_chunks[0]
        return ContentChatResponse(
            text=best_chunk.get("text", "")[:500] + "...",
            intent="content_based",
            confidence=int(best_chunk.get("similarity_score", 0) * 100),
            sources=[
                {
                    "url": best_chunk.get("url", ""),
                    "title": best_chunk.get("title", ""),
                    "relevance": best_chunk.get("similarity_score", 0),
                }
            ],
        )


@app.post("/chat-content", response_model=ContentChatResponse)
async def chat_with_content(request: ContentChatRequest):
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        if not request.agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")

        message_lower = request.message.lower().strip()
        greetings = [
            "hey",
            "hi",
            "hello",
            "good morning",
            "good afternoon",
            "good evening",
            "greetings",
            "howdy",
            "sup",
            "what's up",
        ]
        casual_conversation = [
            "how are you",
            "how's it going",
            "what's going on",
            "how do you do",
            "nice to meet you",
            "thanks",
            "thank you",
            "bye",
            "goodbye",
            "see you",
        ]
        question_words = [
            "what",
            "when",
            "where",
            "who",
            "why",
            "how",
            "which",
            "can",
            "could",
            "would",
            "should",
            "is",
            "are",
            "do",
            "does",
            "did",
        ]

        is_greeting = any(
            g == message_lower
            or message_lower.startswith(g + " ")
            or message_lower.endswith(" " + g)
            for g in greetings
        )
        is_casual = any(c in message_lower for c in casual_conversation)
        has_question = any(
            " " + q + " " in message_lower
            or message_lower.startswith(q + " ")
            or message_lower.endswith(" " + q)
            for q in question_words
        )

        # Prepare QA pairs as list of dicts for RAG agent
        qa_pairs_dict = []
        if request.qa_pairs:
            qa_pairs_dict = [qa.model_dump() for qa in request.qa_pairs]

        # Get company info and persona from stored content if possible
        content_data = content_storage.load_content(request.agent_id)
        business_context = (
            content_data.get("business_context", "") if content_data else ""
        )

        if not business_context and content_data:
            base_url = content_data.get("base_url", "")
            business_context = (
                f"This is an AI support assistant for {base_url}"
                if base_url
                else "This is an AI support assistant."
            )

        # Determine persona: Request override > Stored metadata > Default
        persona_type = request.persona_type or (
            content_data.get("persona_type", "general") if content_data else "general"
        )

        # Determine system prompt: Request override > Stored metadata
        system_prompt = request.system_prompt or (
            content_data.get("system_prompt") if content_data else None
        )

        # Use registry to avoid memory leaks from re-initializing models
        rag_agent = get_rag_agent(request.agent_id, business_context, persona_type)
        stats = rag_agent.get_stats()
        if not stats["vector_store"]["index_exists"]:
            content_data = content_storage.load_content(request.agent_id)
            if content_data:
                try:
                    print(
                        "⚠️  Vector store not found, but content exists. Attempting to index..."
                    )
                    pages = content_data.get("pages", [])
                    if pages:
                        pages_dict = []
                        for page in pages:
                            if isinstance(page, dict):
                                pages_dict.append(page)
                            else:
                                pages_dict.append(
                                    {
                                        "url": getattr(page, "url", ""),
                                        "title": getattr(page, "title", ""),
                                        "main_content": getattr(
                                            page, "main_content", ""
                                        )
                                        or content_data.get("full_content", ""),
                                        "headings": getattr(page, "headings", []),
                                        "paragraphs": getattr(page, "paragraphs", []),
                                        "images": getattr(page, "images", []),
                                        "meta_description": getattr(
                                            page, "meta_description", ""
                                        ),
                                    }
                                )
                        if pages_dict:
                            indexing_stats = rag_agent.index_content(pages_dict)
                            print(
                                f"✅ Indexed {indexing_stats['chunks_indexed']} chunks into vector store"
                            )
                            result = rag_agent.answer(
                                query=request.message,
                                max_context_length=2000,
                                qa_pairs=qa_pairs_dict,
                                history=request.history,
                                persona_type=persona_type,
                            )
                            return ContentChatResponse(
                                text=result["answer"],
                                intent=result["intent"],
                                confidence=result["confidence"],
                                sources=result["sources"],
                            )
                except Exception as e:
                    print(f"⚠️  Error indexing existing content: {e}")
                    import traceback

                    print(traceback.format_exc())

            return await _chat_with_content_fallback(request)

        result = rag_agent.answer(
            query=request.message,
            max_context_length=2000,
            qa_pairs=qa_pairs_dict,
            history=request.history,
            persona_type=persona_type,
            system_prompt=system_prompt,
            company_name=request.company_name,
        )

        return ContentChatResponse(
            text=result["answer"],
            intent=result["intent"],
            confidence=result["confidence"],
            sources=result["sources"],
        )

    except Exception as e:
        import traceback

        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error in /chat-content endpoint: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))


class RenameRequest(BaseModel):
    old_agent_id: str
    new_agent_id: str


@app.post("/rename-agent")
async def rename_agent(request: RenameRequest):
    """
    Rename an agent's content and vector store.
    Used when converting a temporary agent (from scraping) to a permanent one.
    """
    try:
        # Update registry if it exists
        if request.old_agent_id in rag_agent_registry:
            agent = rag_agent_registry.pop(request.old_agent_id)
            agent.agent_id = request.new_agent_id
            rag_agent_registry[request.new_agent_id] = agent

        # 1. Rename content storage
        content_renamed = content_storage.rename_agent(
            request.old_agent_id, request.new_agent_id
        )

        # 2. Rename vector store
        # Note: We create a temporary agent just for renaming if it's not in registry
        # but RAGAgent init loads models, so we check registry first
        if request.new_agent_id in rag_agent_registry:
            vector_renamed = rag_agent_registry[request.new_agent_id].rename_agent(
                request.new_agent_id
            )
        else:
            # We use get_rag_agent to ensure models are loaded efficiently
            temp_agent = get_rag_agent(request.old_agent_id)
            vector_renamed = temp_agent.rename_agent(request.new_agent_id)

        if vector_renamed:
            print(
                f"✅ Successfully renamed agent files and vector store for {request.new_agent_id}"
            )

        return {
            "success": True,
            "message": f"Agent {request.old_agent_id} renamed to {request.new_agent_id}",
            "content_renamed": content_renamed,
            "vector_renamed": vector_renamed,
        }

    except Exception as e:
        import traceback

        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error in /rename-agent endpoint: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/persona-templates")
async def get_all_persona_templates():
    """List all available persona types."""
    return list(SynthesisAgent.PERSONA_TEMPLATES.keys())


@app.get("/persona-templates/{persona_type}")
async def get_persona_template(persona_type: str):
    """Get the professional prompt template for a specific persona type."""
    if persona_type not in SynthesisAgent.PERSONA_TEMPLATES:
        raise HTTPException(status_code=404, detail="Persona type not found")

    # We use a dummy SynthesisAgent to get the full formatted prompt structure
    dummy_agent = SynthesisAgent(llm_agent=llm_agent, persona_type=persona_type)
    system_prompt = dummy_agent.get_persona_prompt(persona_type)

    return {"persona_type": persona_type, "system_prompt": system_prompt}


@app.get("/get-agent-settings/{agent_id}")
async def get_agent_settings(agent_id: str, persona_type: str = None):
    """
    Get agent's current settings including persona and synthesized system prompt.
    """
    try:
        content_data = content_storage.load_content(agent_id)

        # Determine active persona and business context
        if not content_data:
            # For new agents without content, provide defaults
            active_persona = persona_type or "general"
            business_context = ""
            system_prompt = ""  # Will be generated below
        else:
            active_persona = persona_type or content_data.get("persona_type", "general")
            business_context = content_data.get("business_context", "")
            if not business_context:
                base_url = content_data.get("base_url", "")
                business_context = (
                    f"This is an AI support assistant for {base_url}"
                    if base_url
                    else ""
                )
            system_prompt = content_data.get("system_prompt")

        # Get prompt from synthesizer if not already in content_data OR if persona_type was explicitly changed
        saved_persona = content_data.get("persona_type") if content_data else None
        is_persona_changed = persona_type is not None and persona_type != saved_persona
        should_recalculate = not system_prompt or is_persona_changed

        if should_recalculate:
            rag_agent = get_rag_agent(
                agent_id,
                base_company_info=business_context,
                persona_type=active_persona,
            )
            system_prompt = rag_agent.synthesizer.get_persona_prompt(active_persona)

        return {
            "agent_id": agent_id,
            "agent_name": content_data.get("title") if content_data else "Assistant",
            "persona_type": active_persona,
            "system_prompt": system_prompt,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/update-agent-settings")
async def update_agent_settings(request: UpdateSettingsRequest):
    """
    Update agent's persona_type.
    """
    try:
        content_data = content_storage.load_content(request.agent_id)
        if not content_data:
            raise HTTPException(status_code=404, detail="Agent not found")

        content_data["persona_type"] = request.persona_type
        if request.system_prompt:
            content_data["system_prompt"] = request.system_prompt

        content_storage.save_content(request.agent_id, content_data)

        # Also update the registry if it exists
        if request.agent_id in rag_agent_registry:
            rag_agent = rag_agent_registry[request.agent_id]
            rag_agent.set_persona(request.persona_type)

        # Invalidate registry cache to force re-init with new persona
        if request.agent_id in rag_agent_registry:
            del rag_agent_registry[request.agent_id]

        return {"success": True, "persona_type": request.persona_type}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape(request: ScrapeRequest):
    """
    Scrape a website using AsyncWebsiteScraper.
    Supports multi-page crawling with configurable limits.
    """
    try:
        if not request.url or not request.url.strip():
            raise HTTPException(status_code=400, detail="URL is required")

        # Normalize URL
        url = request.url.strip()
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"

        # Validate URL format
        parsed = urlparse(url)
        if not parsed.netloc or "." not in parsed.netloc or " " in parsed.netloc:
            raise HTTPException(
                status_code=400,
                detail="Invalid URL format. Please provide a valid website address (e.g., techifyhub.in).",
            )

        # Create scrape options
        scrape_options = AsyncScrapeOptions(
            max_pages=request.max_pages or 100,
            max_depth=request.max_depth or 5,
            follow_external=request.follow_external or False,
            respect_robots=(
                request.respect_robots if request.respect_robots is not None else True
            ),
            delay=request.delay or 0.5,
        )

        # Initialize scraper
        scraper = AsyncWebsiteScraper(base_url=url, options=scrape_options)

        # 1. First, try a quick single-page check with Playwright for link discovery if it looks JS-heavy
        # Or if we just want to be extra sure for the root page
        initial_page = None
        try:
            from scraper.playwright_scraper import PlaywrightScraper

            pw = PlaywrightScraper(
                timeout=45, page_timeout=45000, wait_until="networkidle"
            )
            if pw.is_available():
                print(f"🎭 [Initial Discovery] Using Playwright for: {url}")
                initial_page = await pw.scrape(url)
                if initial_page:
                    print(
                        f"✅ Discovered {len(initial_page.links)} links with Playwright"
                    )
                await pw.close()
        except Exception as e:
            print(f"⚠️  Playback discovery failed: {e}")

        # 2. Run the full crawl (using initial_page for better links if found)
        print(f"🌐 Starting crawl for: {url}")
        scraped_content = await scraper.run(initial_page=initial_page)

        # Combine content and headings
        all_content = []
        all_headings = []
        for page in scraped_content.pages:
            if page.main_content:
                all_content.append(page.main_content)
            for heading in page.headings:
                if isinstance(heading, dict) and heading.get("text"):
                    all_headings.append(
                        {
                            "level": heading.get("level", "h1"),
                            "text": heading.get("text", ""),
                            "id": heading.get("id", ""),
                        }
                    )

        combined_content = "\n\n".join(all_content)

        # Prepare response data
        response_data = {
            "url": url,
            "title": (
                scraped_content.pages[0].title
                if scraped_content.pages
                else "Scraped Website"
            ),
            "content": combined_content,
            "headings": all_headings,
            "pages": [
                {
                    "url": page.url,
                    "title": page.title,
                    "content": page.main_content,  # Include content in each page
                    "headings": page.headings,
                    "paragraphs": page.paragraphs,
                    "images": page.images,
                    "meta_description": page.meta_description,
                    "depth": page.depth,
                }
                for page in scraped_content.pages
            ],
            "metadata": {
                "total_pages": scraped_content.total_pages,
                "total_characters": len(combined_content),
                "scraped_at": scraped_content.timestamp,
                "errors": scraped_content.errors,
            },
            "stats": {
                "total_pages": scraped_content.total_pages,
                "total_characters": len(combined_content),
                "pages_scraped": len(scraped_content.pages),
                "errors_count": len(scraped_content.errors),
            },
            "persona_type": request.persona_type or "general",
        }

        # 🧪 Extract dynamic Business Context from content
        try:
            temp_synthesizer = SynthesisAgent(llm_agent=llm_agent)

            # Create an identity context from the home page or base URL
            home_page = None
            for page in scraped_content.pages:
                if page.url.rstrip("/") == url.rstrip("/"):
                    home_page = page
                    break
            if not home_page and scraped_content.pages:
                home_page = scraped_content.pages[0]  # Fallback to first page

            site_info = None
            if home_page:
                site_info = {
                    "url": home_page.url,
                    "title": home_page.title,
                    "description": home_page.meta_description,
                }

            extracted_context = temp_synthesizer.extract_business_context(
                combined_content, site_info=site_info
            )
            response_data["business_context"] = extracted_context
            print(f"🏢 Extracted Business Context: {extracted_context}")
        except Exception as e:
            print(f"⚠️  Failed to extract business context: {e}")
            response_data["business_context"] = f"AI Assistant for {url}"

        # Save content if agent_id is provided
        if request.agent_id:
            try:
                content_storage.save_content(request.agent_id, response_data)
                print(f"💾 Saved content for agent: {request.agent_id}")

                # Automatically index content into RAG vector store
                if combined_content and len(combined_content.strip()) > 100:
                    try:
                        # Validate content is readable text (not binary/garbled)
                        def is_readable_text(text: str) -> bool:
                            """Check if text is readable (not binary/garbled)"""
                            if not text:
                                return False
                            # Check if text contains mostly printable ASCII/Unicode characters
                            printable_ratio = sum(
                                1 for c in text[:1000] if c.isprintable() or c.isspace()
                            ) / min(len(text), 1000)
                            # Check for excessive non-ASCII characters that might indicate binary data
                            non_ascii_ratio = sum(
                                1 for c in text[:1000] if ord(c) > 127
                            ) / min(len(text), 1000)
                            # Text should be mostly printable and not too many high-unicode chars
                            return printable_ratio > 0.7 and non_ascii_ratio < 0.5

                        print(f"🔄 Indexing scraped content into RAG vector store...")
                        rag_agent = RAGAgent(
                            agent_id=request.agent_id, llm_agent=llm_agent
                        )

                        # Clear old index first to ensure a fresh, complete rebuild
                        rag_agent.doc_store.delete_index()
                        print(f"🗑️  Cleared old RAG index for fresh rebuild.")

                        # Prepare pages for indexing (filter out garbled content)
                        pages_for_indexing = []
                        for page in scraped_content.pages:
                            page_content = page.main_content or ""

                            # Validate content is readable
                            page_url_lower = (page.url or "").lower().rstrip("/")
                            is_info_page = any(
                                w in page_url_lower
                                for w in [
                                    "contact",
                                    "about",
                                    "support",
                                    "headquarter",
                                    "location",
                                ]
                            )
                            min_len = 15 if is_info_page else 50

                            if page_content and len(page_content.strip()) > min_len:
                                if is_readable_text(page_content):
                                    pages_for_indexing.append(
                                        {
                                            "url": page.url,
                                            "title": page.title or "Untitled",
                                            "main_content": page_content,
                                            "headings": page.headings,
                                            "paragraphs": page.paragraphs,
                                            "images": page.images,
                                            "meta_description": page.meta_description,
                                        }
                                    )
                                else:
                                    print(
                                        f"⚠️  Skipping page {page.url}: content appears to be binary/garbled"
                                    )

                        # If we have valid pages, index them
                        if pages_for_indexing:
                            indexing_stats = rag_agent.index_content(pages_for_indexing)
                            print(
                                f"✅ RAG indexing complete: {indexing_stats['chunks_indexed']} chunks indexed from {indexing_stats['pages_indexed']} pages"
                            )
                        else:
                            print(
                                f"⚠️  No valid pages to index (all content too short, empty, or garbled)"
                            )
                            print(
                                f"   Content preview: {combined_content[:200] if combined_content else 'None'}"
                            )
                    except Exception as e:
                        print(f"⚠️  Warning: Failed to index content into RAG: {e}")
                        import traceback

                        print(traceback.format_exc())
            except Exception as e:
                print(f"⚠️  Warning: Failed to save content: {e}")

        print(
            f"✅ Scraping completed: {scraped_content.total_pages} pages, {len(combined_content)} characters"
        )

        return ScrapeResponse(success=True, data=response_data)

    except HTTPException:
        raise
    except Exception as e:
        import traceback

        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"❌ Error in /scrape endpoint: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")


@app.post("/process-file")
async def process_file(
    file: UploadFile = FastAPIFile(...),
    agent_id: Optional[str] = Form(None),
    persona_type: Optional[str] = Form("general"),
):
    """
    Process an uploaded file (PDF or Text), extract content, and optionaly index it.
    """
    try:
        content = ""
        filename = file.filename

        # 1. Extract text based on file type
        if filename.lower().endswith(".pdf"):
            print(f"📄 Processing PDF file: {filename}")
            pdf_reader = PyPDF2.PdfReader(file.file)
            text_parts = []
            for page in pdf_reader.pages:
                text_parts.append(page.extract_text() or "")
            content = "\n\n".join(text_parts)

            # Extract PDF Title from metadata
            metadata = pdf_reader.metadata
            if metadata and metadata.title:
                pdf_metadata_title = metadata.title.strip()
                # Check for generic titles
                generic_titles = [
                    "untitled document",
                    "untitled",
                    "none",
                    "pdf",
                    "document",
                ]
                if pdf_metadata_title.lower() not in generic_titles:
                    display_title = pdf_metadata_title
                else:
                    display_title = filename
            else:
                display_title = filename
        elif filename.lower().endswith((".txt", ".md")):
            print(f"📄 Processing text file: {filename}")
            content = (await file.read()).decode("utf-8", errors="ignore")
            display_title = filename
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Only PDF and Text files are supported.",
            )

        if not content.strip():
            raise HTTPException(
                status_code=400,
                detail="The file appears to be empty or contains no extractable text.",
            )

        # 2. Prepare response data (similar to scrape response)
        response_data = {
            "url": f"file://{filename}",
            "title": display_title,
            "content": content,
            "headings": [],  # File usually doesn't have structured headings like HTML
            "pages": [
                {
                    "url": f"file://{filename}",
                    "title": display_title,
                    "content": content,
                    "headings": [],
                    "paragraphs": content.split("\n\n"),
                    "images": [],
                    "meta_description": f"Content from uploaded file: {filename}",
                    "depth": 0,
                }
            ],
            "metadata": {
                "total_pages": 1,
                "total_characters": len(content),
                "scraped_at": datetime.now().isoformat(),
                "errors": [],
                "file_type": filename.split(".")[-1] if "." in filename else "unknown",
            },
            "stats": {
                "total_pages": 1,
                "total_characters": len(content),
                "pages_scraped": 1,
                "errors_count": 0,
            },
            "persona_type": persona_type or "general",
        }

        # 3. Extract Business Context
        try:
            temp_synthesizer = SynthesisAgent(llm_agent=llm_agent)
            site_info = {
                "url": f"file://{filename}",
                "title": display_title,
                "description": f"Uploaded file: {filename}",
            }
            extracted_context = temp_synthesizer.extract_business_context(
                content[:10000], site_info=site_info
            )
            response_data["business_context"] = extracted_context
            print(f"🏢 Extracted Business Context from file: {extracted_context}")
        except Exception as e:
            print(f"⚠️ Failed to extract business context from file: {e}")
            response_data["business_context"] = (
                f"AI Assistant for document: {display_title}"
            )

        # 4. Save and Index
        if agent_id:
            try:
                content_storage.save_content(agent_id, response_data)
                print(f"💾 Saved file content for agent: {agent_id}")

                # Index into RAG
                print(f"🔄 Indexing file content into RAG vector store...")
                rag_agent = RAGAgent(agent_id=agent_id, llm_agent=llm_agent)

                # Clear old index
                rag_agent.doc_store.delete_index()

                indexing_stats = rag_agent.index_content(response_data["pages"])
                print(
                    f"✅ RAG indexing complete for file: {indexing_stats['chunks_indexed']} chunks indexed"
                )
            except Exception as e:
                print(f"⚠️ Failed to save/index file content: {e}")

        return {"success": True, "data": response_data}

    except Exception as e:
        import traceback

        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"❌ Error in /process-file endpoint: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8016)
