from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
from agents.intent_classifier import IntentClassifierAgent
from agents.qa_matcher import QAMatcherAgent
from agents.response_generator import ResponseGeneratorAgent
from agents.llm_agent import LLMAgent
from agents.content_retriever import ContentRetrieverAgent
from agents.company_extractor import extract_company_metadata, generate_company_greeting
from scraper import WebsiteScraper, AsyncWebsiteScraper, ScrapeOptions
from content_storage import ContentStorage
from rag_agent import RAGAgent
import os

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

class ScrapeRequest(BaseModel):
    url: str
    agent_id: Optional[str] = None  # Agent ID to store content
    max_pages: Optional[int] = 50
    max_depth: Optional[int] = 3
    follow_external: Optional[bool] = False
    respect_robots: Optional[bool] = True
    delay: Optional[float] = 0.5

class ScrapeResponse(BaseModel):
    success: bool
    data: dict

class ContentChatRequest(BaseModel):
    message: str
    agent_id: str
    confidence_threshold: float = 0.3

class ContentChatResponse(BaseModel):
    text: str
    intent: str
    confidence: int
    sources: List[Dict[str, Any]] = []

# Initialize agents
intent_classifier = IntentClassifierAgent()
qa_matcher = QAMatcherAgent()
response_generator = ResponseGeneratorAgent()
content_retriever = ContentRetrieverAgent()

# Initialize LLM agent (optional - will work even if Ollama is not available)
llm_model = os.getenv("OLLAMA_MODEL", "phi3:mini")  # Default to phi3:mini (3.8B, ~2GB)
ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
llm_agent = LLMAgent(model_name=llm_model, ollama_url=ollama_url)

# Initialize content storage
content_storage = ContentStorage()

# Confidence thresholds
# Minimum similarity that we still consider \"in-knowledge-base\" for this agent.
# Lowered to 0.2 to act like we know everything and catch more matches
MIN_KB_CONFIDENCE = 0.2

# LLM thresholds (only used when we're already above MIN_KB_CONFIDENCE)
LLM_LOW_CONFIDENCE_THRESHOLD = 0.7  # Use LLM to help if confidence < 70%
LLM_REFINE_THRESHOLD = 0.85  # Refine answer if confidence 70-85%

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a user message using CrewAI agents to find intent and match Q&A pairs.
    """
    try:
        # Validate request
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Convert Pydantic models to dictionaries
        qa_pairs_dict = [qa.dict() for qa in request.qa_pairs]
        
        # Filter out invalid Q&A pairs
        valid_qa_pairs = []
        for qa in qa_pairs_dict:
            if qa.get('question') and qa.get('answer'):
                valid_qa_pairs.append(qa)
            else:
                print(f"Warning: Skipping invalid Q&A pair: {qa}")
        
        qa_pairs_dict = valid_qa_pairs
        
        # Check for general conversation and greetings first
        message_lower = request.message.lower().strip()
        greetings = ['hey', 'hi', 'hello', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy', 'sup', "what's up"]
        casual_conversation = ['how are you', "how's it going", "what's going on", 'how do you do', 'nice to meet you', 'thanks', 'thank you', 'bye', 'goodbye', 'see you']
        question_words = ['what', 'when', 'where', 'who', 'why', 'how', 'which', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does', 'did']
        
        is_greeting = any(g == message_lower or message_lower.startswith(g + ' ') or message_lower.endswith(' ' + g) for g in greetings)
        is_casual = any(c in message_lower for c in casual_conversation)
        has_question = any(' ' + q + ' ' in message_lower or message_lower.startswith(q + ' ') or message_lower.endswith(' ' + q) for q in question_words)
        
        # If it's a pure greeting or casual conversation without a question, respond friendly
        if (is_greeting or is_casual) and not has_question:
            # Try to get company-specific greeting from Q&A pairs context
            # Extract company info from Q&A pairs if available
            company_metadata = {}
            if qa_pairs_dict:
                # Try to infer company info from Q&A answers
                for qa in qa_pairs_dict[:3]:  # Check first few Q&A pairs
                    answer = qa.get('answer', '').lower()
                    # Look for company name patterns in answers
                    if 'technologies' in answer or 'solutions' in answer or 'services' in answer:
                        # Extract potential company name
                        import re
                        match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', qa.get('answer', ''))
                        if match:
                            company_metadata['company_name'] = match.group(1)
                            break
            
            # Generate company-specific greeting if we have metadata
            if company_metadata.get('company_name'):
                # Extract services from Q&A pairs
                services = []
                for qa in qa_pairs_dict[:5]:
                    answer_lower = qa.get('answer', '').lower()
                    if 'software' in answer_lower:
                        services.append('software development')
                    if 'website' in answer_lower or 'web' in answer_lower:
                        services.append('website development')
                    if 'marketing' in answer_lower:
                        services.append('digital marketing')
                    if 'app' in answer_lower:
                        services.append('mobile app development')
                
                if services:
                    company_metadata['services'] = list(set(services))[:3]
                    response_text = generate_company_greeting(company_metadata)
                else:
                    # Fallback to generic but friendly greeting
                    response_text = f"Hi! How can I help you today with {company_metadata.get('company_name')}? 😊"
            else:
                # Generic greeting responses
                import random
                greeting_responses = [
                    "Hello! How can I help you?",
                    "Hi there!",
                    "Hello!",
                    "Hi!"
                ]
                casual_responses = [
                    "I'm doing well, thank you!",
                    "You're welcome!",
                    "Thanks!",
                    "Thank you!"
                ]
                
                response_text = random.choice(greeting_responses) if is_greeting else random.choice(casual_responses)
            
            intent_type = 'greeting' if is_greeting else 'casual'
            
            return ChatResponse(
                text=response_text,
                intent=intent_type,
                confidence=95 if is_greeting else 90,
                matched_qa_pair=None,
            )
        
        # Step 1: Classify intent
        intent_result = intent_classifier.classify(request.message, qa_pairs_dict)
        
        # Step 2: Match Q&A pair (always try to match, regardless of intent confidence)
        matched_pair = qa_matcher.find_match(
            request.message,
            qa_pairs_dict,
            intent_result['intent']
        )
        
        # Use a more lenient threshold - if threshold is too high (like 1.0), cap it at 0.6 for conversational flexibility
        # This allows the chatbot to handle general conversation even when user sets 100%
        # Act like we know everything - minimum threshold of 0.2 (20%)
        effective_threshold = min(request.confidence_threshold, 0.6) if request.confidence_threshold > 0.6 else request.confidence_threshold
        effective_threshold = max(effective_threshold, 0.2)
        
        # If we have a matched pair
        if matched_pair:
            confidence_score = matched_pair['confidence']
            top_matches = matched_pair.get('top_matches', [])

            # Even if confidence is low, provide direct answer only
            if confidence_score < MIN_KB_CONFIDENCE:
                # Provide direct answer only
                response_text = matched_pair['answer']
                
                print(
                    f"🔄 Low confidence match ({confidence_score:.2%} < {MIN_KB_CONFIDENCE:.0%}), "
                    f"providing direct answer."
                )
                return ChatResponse(
                    text=response_text,
                    intent=intent_result["intent"],
                    confidence=int(confidence_score * 100),
                    matched_qa_pair={
                        "question": matched_pair["question"],
                        "answer": matched_pair["answer"],
                    },
                )

            # Decision logic for using LLM (only when we're above MIN_KB_CONFIDENCE)
            if confidence_score < LLM_LOW_CONFIDENCE_THRESHOLD:
                # Low/medium confidence (>= MIN_KB_CONFIDENCE but < 70%) -
                # Use LLM to generate direct answer only
                print(f"🤖 Using LLM with Q&A context (confidence: {confidence_score:.2%})")
                llm_answer = llm_agent.generate_answer(
                    user_query=request.message,
                    top_qa_pairs=top_matches,
                    context=None,
                )
                
                # Use LLM answer directly without extra guidance
                response_text = llm_answer

                return ChatResponse(
                    text=response_text,
                    intent=intent_result["intent"],
                    confidence=int(confidence_score * 100),  # Keep original confidence
                    matched_qa_pair={
                        "question": matched_pair["question"],
                        "answer": matched_pair["answer"],
                    },
                )

            if confidence_score < LLM_REFINE_THRESHOLD:
                # Medium confidence (70-85%) - Refine answer with LLM, still constrained to Q&A.
                print(f"✨ Refining answer with LLM (confidence: {confidence_score:.2%})")
                original_answer = matched_pair["answer"]
                refined_answer = llm_agent.refine_answer(
                    user_query=request.message,
                    matched_answer=original_answer,
                    confidence=confidence_score,
                )

                return ChatResponse(
                    text=refined_answer,
                    intent=intent_result["intent"],
                    confidence=int(confidence_score * 100),
                    matched_qa_pair={
                        "question": matched_pair["question"],
                        "answer": matched_pair["answer"],
                    },
                )

            # High confidence (>85%) - Use direct answer (fast path, no LLM)
            print(f"⚡ Direct answer (confidence: {confidence_score:.2%} >= {LLM_REFINE_THRESHOLD:.0%})")
            response = response_generator.generate(
                request.message, matched_pair, intent_result["intent"]
            )

            confidence_value = int(confidence_score * 100)
            confidence_value = max(0, min(100, confidence_value))

            return ChatResponse(
                text=response["text"],
                intent=intent_result["intent"],
                confidence=confidence_value,
                matched_qa_pair={
                    "question": matched_pair["question"],
                    "answer": matched_pair["answer"],
                },
            )

        # If no match found at all but the agent has Q&A, provide simple response
        if qa_pairs_dict:
            print("⚠️ No suitable Q&A match found.")
            return ChatResponse(
                text="I don't have information about that. Please ask a question related to the available topics.",
                intent="no_match",
                confidence=int(intent_result["confidence"] * 100),
                matched_qa_pair=None,
            )
        
        # If no Q&A pairs at all and intent confidence is too low
        if intent_result['confidence'] < effective_threshold:
            return ChatResponse(
                text="I'm not sure I understand. Could you rephrase your question?",
                intent="unknown",
                confidence=int(intent_result['confidence'] * 100),
                matched_qa_pair=None
            )
        
        # If intent confidence is OK but no match found and no Q&A pairs
        return ChatResponse(
            text="I don't have an answer for that question. Please contact support for more information.",
            intent=intent_result['intent'],
            confidence=int(intent_result['confidence'] * 100),
            matched_qa_pair=None
        )
        
        
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error in /chat endpoint: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_website(request: ScrapeRequest):
    """
    Scrape a website with multi-page crawling support.
    Returns full website content without character limits.
    """
    try:
        # Validate URL
        if not request.url or not request.url.strip():
            raise HTTPException(status_code=400, detail="URL is required")
        
        # Normalize URL
        url = request.url.strip()
        if not url.startswith(('http://', 'https://')):
            url = f"https://{url}"
        
        # Import scraper components
        from scraper.async_website_scraper import AsyncScrapeOptions
        from scraper.hybrid_scraper import HybridScraper, ScraperConfig
        
        # Create hybrid scraper config
        hybrid_config = ScraperConfig(
            min_content_length=200,  # Minimum chars to consider content sufficient
            max_script_ratio=0.3,  # Max ratio of script tags
            enable_playwright=True,  # Enable Playwright fallback
            prefer_playwright=False,  # Don't force Playwright, use it as fallback
            playwright_timeout=30000,  # 30 seconds
            playwright_wait_until="networkidle"
        )
        
        # Create hybrid scraper for single-page scraping
        hybrid_scraper = HybridScraper(
            config=hybrid_config,
            timeout=30,  # HTTP timeout
            user_agent="Chatbase-Clone-Scraper/1.0"
        )
        
        # Scrape the main page with hybrid scraper
        print(f"🔀 Starting hybrid scrape: {url}")
        main_page = await hybrid_scraper.scrape(url)
        
        if not main_page:
            raise HTTPException(status_code=500, detail="Failed to scrape website with all available scrapers")
        
        # For multi-page crawling, use AsyncWebsiteScraper but with hybrid scraper for each page
        # For now, we'll use the existing AsyncWebsiteScraper for multi-page support
        # TODO: Integrate HybridScraper into AsyncWebsiteScraper for per-page scraping
        
        # Create scrape options for multi-page crawling
        options = AsyncScrapeOptions(
            max_pages=request.max_pages or 100,
            max_depth=request.max_depth or 5,
            concurrency=5,
            follow_external=request.follow_external or False,
            respect_robots=request.respect_robots if request.respect_robots is not None else True,
            delay=request.delay or 0.3
        )
        
        # Initialize async scraper for multi-page crawling
        scraper = AsyncWebsiteScraper(
            base_url=url,
            options=options,
            storage_dir="content_storage"
        )
        
        # Scrape website asynchronously (multi-page)
        print(f"🌐 Starting multi-page crawl: {url}")
        scraped_content = await scraper.run()
        
        # Replace first page with hybrid-scraped page if it's better
        if scraped_content.pages and main_page:
            if len(main_page.main_content) > len(scraped_content.pages[0].main_content):
                scraped_content.pages[0] = main_page
                print(f"✅ Replaced first page with hybrid-scraped content ({len(main_page.main_content)} chars)")
        
        # Cleanup hybrid scraper
        await hybrid_scraper.close()
        
        # Combine all pages content - ensure we get actual content
        all_content = "\n\n".join([
            page.main_content for page in scraped_content.pages 
            if page.main_content and len(page.main_content.strip()) > 0
        ])
        
        # If all_content is still empty, try to get content from first page
        if not all_content or len(all_content.strip()) == 0:
            if scraped_content.pages:
                first_page = scraped_content.pages[0]
                if first_page.main_content:
                    all_content = first_page.main_content
                    print(f"⚠️  Using first page content only: {len(all_content)} chars")
        all_headings = []
        all_paragraphs = []
        all_images = []
        
        for page in scraped_content.pages:
            all_headings.extend(page.headings)
            all_paragraphs.extend(page.paragraphs)
            all_images.extend(page.images)
        
        # Log scraping results for debugging
        print(f"📊 Scraping results:")
        print(f"   - Total pages: {scraped_content.total_pages}")
        print(f"   - Total characters: {len(all_content)}")
        print(f"   - Total headings: {len(all_headings)}")
        print(f"   - Total paragraphs: {len(all_paragraphs)}")
        print(f"   - Total images: {len(all_images)}")
        
        # Log per-page stats
        for i, page in enumerate(scraped_content.pages[:5], 1):  # Log first 5 pages
            print(f"   - Page {i}: {page.url[:60]}... ({len(page.main_content)} chars, {len(page.links)} links)")
        
        if len(all_content) == 0:
            print("⚠️  WARNING: No content extracted from any pages!")
            # Try to get at least some content from first page
            if scraped_content.pages:
                first_page = scraped_content.pages[0]
                if hasattr(first_page, 'main_content') and first_page.main_content:
                    all_content = first_page.main_content
                    print(f"   - Using first page content: {len(all_content)} chars")
                else:
                    print(f"   - First page also has no content!")
        
        # Get first page metadata (or combine from all pages)
        first_page = scraped_content.pages[0] if scraped_content.pages else None
        metadata = {
            "description": first_page.meta_description if first_page else None,
            "title": first_page.title if first_page else None
        }
        
        # Prepare response
        response_data = {
            "title": first_page.title if first_page else "Scraped Website",
            "content": all_content,  # Full content, no limits!
            "url": scraped_content.base_url,
            "headings": all_headings,
            "paragraphs": all_paragraphs,
            "images": all_images,
            "metadata": metadata,
            "stats": {
                "totalPages": scraped_content.total_pages,
                "totalCharacters": len(all_content),  # Use actual combined content length
                "headingsCount": len(all_headings),
                "paragraphsCount": len(all_paragraphs),
                "imagesCount": len(all_images),
                "errorsCount": len(scraped_content.errors)
            },
            "pages": [
                {
                    "url": page.url,
                    "title": page.title,
                    "content": page.main_content,  # Add actual content text (not just length)
                    "contentLength": len(page.main_content),
                    "headingsCount": len(page.headings),
                    "paragraphsCount": len(page.paragraphs),
                    "imagesCount": len(page.images),
                    "linksCount": len(page.links),
                    "depth": page.depth
                }
                for page in scraped_content.pages
            ],
            "errors": scraped_content.errors[:10]  # Include first 10 errors
        }
        
        print(f"✅ Successfully scraped {scraped_content.total_pages} pages, {scraped_content.total_characters} characters")
        
        # Save content to storage if agent_id is provided
        if request.agent_id:
            content_storage.save_content(request.agent_id, response_data)
            print(f"💾 Content saved for agent: {request.agent_id}")
            
            # Index content into vector store for fast retrieval
            try:
                # Convert ScrapedPage dataclass objects to dictionaries
                pages_dict = []
                for page in scraped_content.pages:
                    pages_dict.append({
                        'url': page.url,
                        'title': page.title,
                        'main_content': page.main_content,
                        'headings': page.headings,
                        'paragraphs': page.paragraphs,
                        'images': page.images,
                        'meta_description': page.meta_description,
                        'depth': page.depth,
                        'timestamp': page.timestamp
                    })
                
                rag_agent = RAGAgent(agent_id=request.agent_id, llm_agent=llm_agent)
                indexing_stats = rag_agent.index_content(pages_dict)
                print(f"🔍 Indexed {indexing_stats['chunks_indexed']} chunks into vector store")
                response_data['indexing_stats'] = indexing_stats
            except Exception as e:
                import traceback
                print(f"⚠️  Error indexing content: {e}")
                print(f"   Traceback: {traceback.format_exc()}")
                # Continue even if indexing fails
        
        return ScrapeResponse(
            success=True,
            data=response_data
        )
        
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error in /scrape endpoint: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))

async def _chat_with_content_fallback(request: ContentChatRequest) -> ContentChatResponse:
    """
    Fallback method using old content storage (for backward compatibility).
    """
    # Load stored content
    content_data = content_storage.load_content(request.agent_id)
    if not content_data:
        # Check if it's a greeting - provide friendly response even without content
        message_lower = request.message.lower().strip()
        greetings = ['hey', 'hi', 'hello', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy', 'sup', "what's up"]
        is_greeting = any(g == message_lower or message_lower.startswith(g + ' ') or message_lower.endswith(' ' + g) for g in greetings)
        
        if is_greeting:
            return ContentChatResponse(
                text="Hi! How can I help you today? 😊",
                intent="greeting",
                confidence=95,
                sources=[]
            )
        
        return ContentChatResponse(
            text="I don't have any content stored for this agent. Please scrape a website first.",
            intent="no_content",
            confidence=0,
            sources=[]
        )
    
    # Get content chunks
    content_chunks = content_storage.get_content_chunks(request.agent_id, chunk_size=1000)
    
    if not content_chunks:
        return ContentChatResponse(
            text="I couldn't find any content to answer your question.",
            intent="no_content",
            confidence=0,
            sources=[]
        )
    
    # Find relevant chunks using semantic search
    relevant_chunks = content_retriever.find_relevant_chunks(
        request.message,
        content_chunks,
        top_k=3
    )
    
    if not relevant_chunks or relevant_chunks[0].get("similarity_score", 0) < request.confidence_threshold:
        return ContentChatResponse(
            text="I couldn't find relevant information in the stored content to answer your question.",
            intent="no_match",
            confidence=0,
            sources=[]
        )
    
    # Build context from relevant chunks
    context = "\n\n".join([
        f"From {chunk.get('title', 'Unknown')} ({chunk.get('url', '')}):\n{chunk.get('text', '')[:500]}"
        for chunk in relevant_chunks
    ])
    
    # Generate answer using LLM with context
    try:
        answer = llm_agent.generate_answer_from_content(
            user_query=request.message,
            context=context
        )
        
        # Calculate confidence from similarity scores
        avg_confidence = sum(chunk.get("similarity_score", 0) for chunk in relevant_chunks) / len(relevant_chunks)
        confidence_percent = int(min(avg_confidence * 100, 100))
        
        # Prepare sources
        sources = [
            {
                "url": chunk.get("url", ""),
                "title": chunk.get("title", ""),
                "relevance": chunk.get("similarity_score", 0)
            }
            for chunk in relevant_chunks
        ]
        
        return ContentChatResponse(
            text=answer,
            intent="content_based",
            confidence=confidence_percent,
            sources=sources
        )
        
    except Exception as e:
        print(f"⚠️  LLM error, using direct content: {e}")
        # Fallback: use the most relevant chunk directly
        best_chunk = relevant_chunks[0]
        return ContentChatResponse(
            text=best_chunk.get("text", "")[:500] + "...",
            intent="content_based",
            confidence=int(best_chunk.get("similarity_score", 0) * 100),
            sources=[{
                "url": best_chunk.get("url", ""),
                "title": best_chunk.get("title", ""),
                "relevance": best_chunk.get("similarity_score", 0)
            }]
        )

@app.post("/chat-content", response_model=ContentChatResponse)
async def chat_with_content(request: ContentChatRequest):
    """
    RAG-based chat endpoint using vector store for fast semantic search.
    Uses persisted embeddings for better performance.
    """
    try:
        # Validate request
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        if not request.agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")
        
        # Check for greetings first (before initializing RAG agent)
        message_lower = request.message.lower().strip()
        greetings = ['hey', 'hi', 'hello', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy', 'sup', "what's up"]
        casual_conversation = ['how are you', "how's it going", "what's going on", 'how do you do', 'nice to meet you', 'thanks', 'thank you', 'bye', 'goodbye', 'see you']
        question_words = ['what', 'when', 'where', 'who', 'why', 'how', 'which', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does', 'did']
        
        is_greeting = any(g == message_lower or message_lower.startswith(g + ' ') or message_lower.endswith(' ' + g) for g in greetings)
        is_casual = any(c in message_lower for c in casual_conversation)
        has_question = any(' ' + q + ' ' in message_lower or message_lower.startswith(q + ' ') or message_lower.endswith(' ' + q) for q in question_words)
        
        # If it's a pure greeting, try to get company-specific response
        if (is_greeting or is_casual) and not has_question:
            # Load content to extract company metadata
            content_data = content_storage.load_content(request.agent_id)
            if content_data:
                company_metadata = extract_company_metadata(content_data)
                greeting_text = generate_company_greeting(company_metadata)
            else:
                # Fallback to generic greeting
                greeting_text = "Hi! How can I help you today? 😊"
            
            return ContentChatResponse(
                text=greeting_text,
                intent='greeting' if is_greeting else 'casual',
                confidence=95 if is_greeting else 90,
                sources=[]
            )
        
        # Initialize RAG agent (loads vector store if exists)
        rag_agent = RAGAgent(agent_id=request.agent_id, llm_agent=llm_agent)
        
        # Check if vector store has content
        stats = rag_agent.get_stats()
        if not stats['vector_store']['index_exists']:
            # Try to load content from JSON storage first
            content_data = content_storage.load_content(request.agent_id)
            if content_data:
                # Content exists but not indexed - try to index it now
                try:
                    print(f"⚠️  Vector store not found, but content exists. Attempting to index...")
                    pages = content_data.get('pages', [])
                    if pages:
                        # Convert pages to dict format if needed
                        pages_dict = []
                        for page in pages:
                            if isinstance(page, dict):
                                pages_dict.append(page)
                            else:
                                # Convert ScrapedPage dataclass to dict
                                pages_dict.append({
                                    'url': getattr(page, 'url', ''),
                                    'title': getattr(page, 'title', ''),
                                    'main_content': getattr(page, 'main_content', '') or content_data.get('full_content', ''),
                                    'headings': getattr(page, 'headings', []),
                                    'paragraphs': getattr(page, 'paragraphs', []),
                                    'images': getattr(page, 'images', []),
                                    'meta_description': getattr(page, 'meta_description', ''),
                                })
                        
                        if pages_dict:
                            indexing_stats = rag_agent.index_content(pages_dict)
                            print(f"✅ Indexed {indexing_stats['chunks_indexed']} chunks into vector store")
                            # Now retry the query
                            result = rag_agent.answer(
                                query=request.message,
                                top_k=5,
                                min_similarity=0.2,
                                confidence_threshold=request.confidence_threshold,
                                max_context_length=2000
                            )
                            return ContentChatResponse(
                                text=result['answer'],
                                intent=result['intent'],
                                confidence=result['confidence'],
                                sources=result['sources']
                            )
                except Exception as e:
                    print(f"⚠️  Error indexing existing content: {e}")
                    import traceback
                    print(traceback.format_exc())
            
            # Fallback to old method if vector store doesn't exist
            return await _chat_with_content_fallback(request)
        
        # Use RAG agent for answer generation
        result = rag_agent.answer(
            query=request.message,
            top_k=5,
            min_similarity=0.2,
            confidence_threshold=request.confidence_threshold,
            max_context_length=2000
        )
        
        return ContentChatResponse(
            text=result['answer'],
            intent=result['intent'],
            confidence=result['confidence'],
            sources=result['sources']
        )
        
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error in /chat-content endpoint: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
