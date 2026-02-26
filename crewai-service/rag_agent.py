"""
RAG Agent - Complete RAG pipeline with vector store, semantic search, and LLM generation.
Integrates chunking, embedding, vector storage, and answer generation.
"""

import os
import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from vector_store import VectorStore
from chunking import SemanticChunker
from agents.llm_agent import LLMAgent
from sentence_transformers import SentenceTransformer, CrossEncoder
from agents.qa_matcher import QAMatcherAgent

logger = logging.getLogger(__name__)


class RAGAgent:
    """
    Complete RAG (Retrieval Augmented Generation) agent.
    Handles chunking, embedding, vector storage, semantic search, and answer generation.
    """
    
    JUNK_NON_ASCII_THRESHOLD = 0.3  # Ratio of non-ASCII characters above which text is considered junk

    # Static cache for reranker model (Memory leak fix)
    _reranker_cache = None
    _reranker_failed = False

    def __init__(
        self,
        agent_id: str,
        llm_agent: Optional[Any] = None,
        chunk_size: int = 400,
        storage_dir: str = "vector_storage",
        base_company_info: str = ""
    ):
        """
        Initialize RAG agent.
        
        Args:
            agent_id: Unique identifier for the agent
            llm_agent: LLM agent instance (optional, will create if None)
            chunk_size: Target chunk size in tokens
            storage_dir: Directory for vector store
            base_company_info: Base information about the company to include in prompts
        """
        self.agent_id = agent_id
        self.llm_agent = llm_agent or LLMAgent()
        self.base_company_info = base_company_info
        
        # Determine internal company name for branding
        self.company_name = self._infer_company_name()
        
        # Initialize stores
        self.chunker = SemanticChunker(chunk_size=chunk_size, chunk_overlap=100)
        self.doc_store = VectorStore(
            agent_id=agent_id,
            storage_dir=storage_dir,
            index_type="docs"
        )
        self.faq_store = VectorStore(
            agent_id=agent_id,
            storage_dir=storage_dir,
            index_type="faq"
        )
        self.qa_matcher = QAMatcherAgent()
        
        # Initialize Re-ranker (BAAI/bge-reranker-base) using static cache
        self.reranker = None
        reranker_disabled = os.environ.get("DISABLE_RERANKER", "false").lower() == "true"
        
        if not reranker_disabled and not RAGAgent._reranker_failed:
            if RAGAgent._reranker_cache is None:
                try:
                    RAGAgent._reranker_cache = CrossEncoder('BAAI/bge-reranker-base')
                    logger.info("✅ Re-ranker loaded into cache: BAAI/bge-reranker-base")
                except Exception as e:
                    RAGAgent._reranker_failed = True
                    error_msg = str(e)
                    if "1455" in error_msg or "paging file" in error_msg.lower() or "allocate" in error_msg.lower():
                        logger.warning("⚠️ Re-ranker disabled: not enough memory.")
                    else:
                        logger.error(f"❌ Failed to load re-ranker: {e}")
            
            self.reranker = RAGAgent._reranker_cache
        elif reranker_disabled:
            logger.info("ℹ️ Re-ranker disabled via DISABLE_RERANKER env var.")
        
        logger.info(f"✅ RAG Agent initialized for agent: {agent_id}")

    def _infer_company_name(self) -> str:
        """Infer company name from base_info or agent_id"""
        if self.base_company_info and "MedTrust" in self.base_company_info:
            return "MedTrust"
        
        # Try to extract from URL if possible
        if self.base_company_info and "https://" in self.base_company_info:
            match = re.search(r'https?://([^/]+)', self.base_company_info)
            if match:
                domain = match.group(1).replace("www.", "")
                # Special cases for popular sites
                if "huggingface.co" in domain: return "HuggingFace"
                if "formula1.com" in domain: return "Formula 1"
                return domain.split('.')[0].capitalize()
        
        # Fallback to agent_id if it's not a timestamp (legacy support)
        if hasattr(self, 'agent_id') and not str(self.agent_id).isdigit():
             return str(self.agent_id).capitalize()
        
        return "the company"
             
        return "the company"

    def is_junk_text(self, text: str) -> bool:
        """
        Check if text contains binary junk or too many non-ASCII characters.
        Useful for filtering out corrupted scraping results.
        """
        if not text or len(text.strip()) < 10:
            return False # Too short to judge as junk
        
        # Count non-ASCII or unprintable characters
        junk_chars = 0
        for char in text:
            # Check for binary-like characters or excessive non-ASCII
            # Keep emojis and common formatting, but flag binary/corrupted bytes
            if ord(char) > 127 or (ord(char) < 32 and char not in "\r\n\t"):
                junk_chars += 1
                
        # If more than 30% is "junk", it's likely corrupted
        junk_ratio = junk_chars / len(text)
        if junk_ratio > self.JUNK_NON_ASCII_THRESHOLD:
            return True
            
        # Check for "word density" - if there are no spaces in a long string, it's likely binary noise
        if " " not in text.strip() and len(text.strip()) > 50:
            return True
            
        return False

    @staticmethod
    def _extract_clean_answer_from_chunk(text: str, max_chars: int = 220) -> str:
        """
        Extract 1-2 clear sentences from raw chunk text so the answer reads like
        'X is a ...' instead of a raw dump of lists and fragments.
        """
        if not text or len(text.strip()) < 15:
            return text.strip()[:max_chars] if text else ""
        text = re.sub(r'\s+', ' ', text.strip())
        # Split on sentence boundaries (keep the delimiter by not using lookahead)
        sentences = re.split(r'(?<=[.!?])\s+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        # Prefer a definition-style sentence (e.g. "X is a platform", "We are ...")
        definition_markers = (
            r"\bis\s+(?:a|an|the)\s+",
            r"\bare\s+",
            r"\b(?:platform|service|company|website|product)\b",
            r"\b(?:helps?|provides?|offers?)\b",
        )
        chosen = []
        for s in sentences:
            if any(re.search(m, s, re.I) for m in definition_markers):
                chosen.append(s)
                if len(' '.join(chosen)) <= max_chars and len(chosen) <= 2:
                    break
                if len(chosen) >= 2:
                    break
        if not chosen:
            chosen = sentences[:2]
        result = ' '.join(chosen).strip()
        if len(result) > max_chars:
            result = result[:max_chars].rsplit(' ', 1)[0].rstrip('.,;')
            if not result.endswith('.'):
                result += "."
        return result or text[:max_chars]
    
    def index_content(
        self,
        pages: List[Dict[str, Any]],
        batch_size: int = 32
    ) -> Dict[str, Any]:
        """
        Index scraped pages into vector store.
        This is called after scraping to prepare content for retrieval.
        
        Args:
            pages: List of scraped page dictionaries
            batch_size: Batch size for embedding computation
        
        Returns:
            Statistics about indexing
        """
        logger.info(f"🔄 Indexing {len(pages)} pages for agent {self.agent_id}...")
        
        # Chunk all pages
        chunks = self.chunker.chunk_pages(pages)
        
        if not chunks:
            logger.warning("No chunks created from pages")
            return {
                'pages_indexed': len(pages),
                'chunks_created': 0,
                'chunks_indexed': 0
            }
        
        # Filter out junk chunks before indexing
        filtered_chunks = []
        for chunk in chunks:
            if not self.is_junk_text(chunk.get("text", "")):
                filtered_chunks.append(chunk)
            else:
                logger.warning(f"🚫 Filtering out junk chunk: {chunk.get('text', '')[:50]}...")
        
        if not filtered_chunks:
            logger.error("❌ All chunks were filtered out as junk! Nothing to index.")
            return {
                'pages_indexed': len(pages),
                'chunks_indexed': 0,
                'status': 'error_content_corrupted'
            }

        # Add chunks to document store
        chunks_added = self.doc_store.add_chunks(filtered_chunks, batch_size=batch_size)
        
        stats = {
            'pages_indexed': len(pages),
            'chunks_created': len(chunks),
            'chunks_indexed': chunks_added
        }
        
        logger.info(f"✅ Indexing complete: {chunks_added} chunks indexed")
        return stats
    
    def search_docs(
        self,
        query: str,
        top_k: int = 10,
        min_similarity: float = 0.3
    ) -> List[Dict[str, Any]]:
        """Perform semantic search over Document store"""
        return self.doc_store.search(query, top_k=top_k, min_similarity=min_similarity)

    def search_faq(
        self,
        query: str,
        top_k: int = 5,
        min_similarity: float = 0.4
    ) -> List[Dict[str, Any]]:
        """Perform semantic search over FAQ store"""
        return self.faq_store.search(query, top_k=top_k, min_similarity=min_similarity)

    def index_faq(self, qa_pairs: List[Dict[str, Any]]) -> int:
        """Index manual Q&A pairs into the FAQ store"""
        if not qa_pairs:
            return 0
        
        # Dirty check: if index size matches provided pairs, skip re-indexing
        # (This avoids bloating the index on every request)
        current_stats = self.faq_store.get_stats()
        if current_stats.get('total_chunks', 0) == len(qa_pairs):
            return 0

        # Clear existing index to avoid duplicates if count is different
        if current_stats.get('total_chunks', 0) > 0:
            logger.info(f"🔄 FAQ count changed ({current_stats.get('total_chunks')} -> {len(qa_pairs)}). Re-indexing...")
            self.faq_store.delete_index()
            
        chunks = []
        for i, qa in enumerate(qa_pairs):
            question = qa.get('question', '')
            answer = qa.get('answer', '')
            if question and answer:
                chunks.append({
                    'chunk_id': f"faq-{i}",
                    'text': f"Question: {question}\nAnswer: {answer}",
                    'question': question,
                    'answer': answer,
                    'url': 'Manual FAQ',
                    'title': 'Manual Q&A',
                    'is_qa': True # Mark as professional Q&A
                })
        
        return self.faq_store.add_chunks(chunks)

    def rewrite_query(self, query: str) -> str:
        """Simple query rewriting for common support phrases"""
        q = query.lower().strip()
        # Improve keyword detection for better semantic hits
        if any(w in q for w in ["where", "location", "address"]):
            if "location" not in q: q += " location address"
        if any(w in q for w in ["contact", "phone", "number", "email"]):
            if "contact" not in q: q += " contact information"
        
        # Identity query boosting: if user asks "what is [company]", make it explicit
        if self.company_name and self.company_name.lower() in q:
            if "what is" in q or "who is" in q or "tell me about" in q:
                if "about" not in q: q += f" about {self.company_name} identity description"
        
        return q
    
    def build_prompt(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
        max_context_length: int = 2000
    ) -> Tuple[str, List[Dict[str, str]]]:
        """
        Build a strict, grounded prompt for LLM.
        Instructs LLM to answer ONLY from provided context.
        
        Args:
            query: User question
            chunks: Retrieved relevant chunks
            max_context_length: Maximum characters for context
        
        Returns:
            Tuple of (full_prompt, sources_list)
        """
        # Build system instructions
        # Dynamic Persona building
        persona = f"help desk agent for {self.company_name}"
        if self.company_name == "MedTrust":
            persona = "professional support assistant for MedTrust"
            
        base_info = f"\n[GLOBAL KNOWLEDGE - WHO YOU ARE]\n{self.base_company_info}\n" if self.base_company_info else ""
        
        system_msg = (
            f"You are a {persona}.\n"
            "Your goal is to provide accurate, helpful answers based on the provided context.\n"
            "1. If [AUTHORITATIVE KNOWLEDGE] is provided, prioritize it.\n"
            "2. Combine information from multiple sources if they are all relevant.\n"
            "3. If the context does not contain enough information to answer definitively, provide a polite response mentioning what you DO find, or say you don't have enough specific info.\n"
            "4. Do not mention the source numbers or use outside knowledge.\n\n"
            f"{base_info}"
            "CONTEXT CONTENT:"
        )
        
        # Build context from chunks
        context_parts = []
        sources = []
        current_length = len(system_msg)
        
        for i, chunk in enumerate(chunks):
            chunk_text = chunk.get('answer') if chunk.get('is_qa') else chunk.get('text', '')
            chunk_url = chunk.get('url', '')
            chunk_title = chunk.get('title', '')
            similarity = chunk.get('similarity_score', 0)
            
            # Format chunk with source info
            is_qa = chunk.get('is_qa', False)
            prefix = "[AUTHORITATIVE KNOWLEDGE] " if is_qa else ""
            suffix = " (Manual Q&A)" if is_qa else f" ({chunk_url})"
            chunk_context = f"\n{prefix}[Source {i+1}: {chunk_title}{suffix}]\n{chunk_text}\n"
            
            # Check if adding this chunk would exceed max length
            if current_length + len(chunk_context) > max_context_length:
                # Try to add a truncated version
                remaining = max_context_length - current_length - 100  # Leave room for question
                if remaining > 100:
                    chunk_context = f"\n[Source {i+1}: {chunk_title} ({chunk_url})]\n{chunk_text[:remaining]}...\n"
                else:
                    break
            
            context_parts.append(chunk_context)
            sources.append({
                'url': chunk_url,
                'title': chunk_title,
                'relevance': similarity
            })
            current_length += len(chunk_context)
        
        # Combine system prompt + context + question
        context = ''.join(context_parts)
        user_question = f"\n\nThe user is asking: {query}\n\nYour friendly, helpful response:"
        
        full_prompt = f"{system_msg}\n{context}\n\nQUESTION: {query}"
        
        return full_prompt, sources
    
    def answer(
        self,
        query: str,
        max_context_length: int = 2500,
        qa_pairs: Optional[List[Dict]] = None,
        history: Optional[List[Dict[str, str]]] = None,
        top_k: int = 5,
        min_similarity: float = 0.3,
        confidence_threshold: float = 0.3
    ) -> Dict[str, Any]:
        """
        Production RAG Pipeline:
        1. Query Rewriting
        2. FAQ Semantic Check (Threshold > 0.75)
        3. Document Retrieval (Top 10)
        4. Re-ranking (Top 5)
        5. LLM Synthesis (Top 3)
        """
        # 1. Query Re-contextualization (Memory/Context)
        original_query = query
        if history and len(history) > 0:
            query = self._recontextualize_query(query, history)
            logger.info(f"🧠 Re-contextualized: '{original_query}' -> '{query}'")
        
        # 1.1 Query Rewriting (Identity Grounding)
        query = self.rewrite_query(query)
        logger.info(f"🔍 Processing query: '{original_query}' -> '{query}'")

        # 2. FAQ Semantic Check (Step 2 of roadmap)
        if qa_pairs:
            self.index_faq(qa_pairs)
        
        faq_hits = self.search_faq(query, top_k=2, min_similarity=0.75)
        
        # 3. Document Retrieval (Step 6 of roadmap: Retrieve 10)
        logger.info(f"📂 Searching Document RAG (Top 10)...")
        doc_hits = self.search_docs(query, top_k=10, min_similarity=0.3)
        
        if not doc_hits and not faq_hits:
            logger.warning(f"⚠️ No matches found for query: {query}")
            return {
                'answer': "I don't have that information in my knowledge base.",
                'confidence': 0,
                'sources': [],
                'intent': 'no_match',
                'metadata': {'reason': 'no_retrieval', 'query': query}
            }

        # 4. Re-ranking (Step 6: Rerank docs, then merge FAQ)
        final_chunks = []
        top_rerank_score = 0.0
        
        if self.reranker and doc_hits:
            try:
                # Filter out hits that are too short for reranking
                valid_doc_hits = [h for h in doc_hits if len(h.get('text', '')) > 20]
                if not valid_doc_hits: valid_doc_hits = doc_hits[:3] # Fallback
                
                pairs = [[query, hit.get('text', '')] for hit in valid_doc_hits]
                rerank_scores = self.reranker.predict(pairs)
                for i, score in enumerate(rerank_scores):
                    valid_doc_hits[i]['rerank_score'] = float(score)
                
                valid_doc_hits.sort(key=lambda x: x.get('rerank_score', -10), reverse=True)
                top_rerank_score = valid_doc_hits[0]['rerank_score']
                
                # FALLBACK: If reranker is being too aggressive (low scores) but similarity was very high
                # We trust similarity more if it's > 0.7 even if reranker is skeptical
                if top_rerank_score < 0.1 and any(h.get('similarity_score', 0) > 0.65 for h in valid_doc_hits):
                    logger.warning("⚠️ Reranker score is very low but similarity is high. Blending scores.")
                    for h in valid_doc_hits:
                        # Blend score: 70% similarity, 30% reranker for better stability
                        h['rerank_score'] = (h.get('similarity_score', 0) * 0.7) + (max(0, h.get('rerank_score', 0)) * 0.3)
                    valid_doc_hits.sort(key=lambda x: x.get('rerank_score', 0), reverse=True)
                    top_rerank_score = valid_doc_hits[0]['rerank_score']
                
                final_chunks = valid_doc_hits[:5]
                logger.info(f"🏆 Reranked top doc chunk: {top_rerank_score:.2f}")
            except Exception as e:
                logger.error(f"❌ Reranking failed: {e}")
                final_chunks = doc_hits[:5]
        else:
            final_chunks = doc_hits[:5]

        # Merge FAQ hits at the VERY top (highest priority)
        # We only keep FAQ hits if they are better than a threshold or just prepend them
        for hit in reversed(faq_hits): # Insert at beginning
            final_chunks.insert(0, hit)

        # 5. LLM Synthesis (Step 6: Send top 3-5 to LLM)
        top_chunks = final_chunks[:5] # Use more context to allow filtering
        logger.info(f"🧠 Synthesizing answer from {len(top_chunks)} chunks (including FAQ)...")
        
        try:
            prompt, sources = self.build_prompt(query, top_chunks, max_context_length)
            answer = self.llm_agent.generate_answer_from_content(
                user_query=query,
                context=prompt
            )
            
            # Check for hallucination or "I don't know"
            refusal_phrases = [
                "i don't have", "not in the context", "cannot answer", 
                "not provided", "no information", "information about that is not",
                "does not mention", "context doesn't", "don't see any information"
            ]
            if not answer or any(phrase in answer.lower() for phrase in refusal_phrases):
                # Identity Fallback: If it's a "what is" query and first search failed, 
                # try a broader search on the home page or specific definition
                is_identity_query = any(w in query.lower() for w in ["what is", "who is", "tell me about"])
                if is_identity_query and doc_hits:
                     logger.info("🆔 Attempting Identity Fallback for LLM refusal...")
                     # Find chunk with highest similarity that isn't a header/footer
                     best_doc = sorted(doc_hits, key=lambda x: x.get('similarity_score', 0), reverse=True)[0]
                     if best_doc.get('similarity_score', 0) > 0.4:  # Lowered from 0.5
                         answer = self._extract_clean_answer_from_chunk(best_doc.get('text', ''))
                         if answer:
                             return {
                                 'answer': answer,
                                 'confidence': int(best_doc['similarity_score'] * 100),
                                 'sources': sources[:1],
                                 'intent': 'identity_fallback'
                             }

                return {
                    'answer': "I don't have that information in my knowledge base.",
                    'confidence': 0,
                    'sources': [],
                    'intent': 'no_match',
                    'metadata': {'reason': 'llm_refusal'}
                }

            # 6. Confidence Calculation (with Buffering for 100% case)
            # We use max of rerank_score (0-1) and similarity (0-1)
            top_score = 0.0
            if top_chunks:
                # FAQ chunks have similarity_score, Doc chunks have rerank_score
                top_score = max(
                    top_chunks[0].get('rerank_score', 0), 
                    top_chunks[0].get('similarity_score', 0)
                )
                
            # SCALE: 0.7 score -> 85% confidence, 0.8+ score -> 95%+ confidence
            # This handles the "100% threshold" setting gracefully
            confidence = int(top_score * 100)
            
            # Qualitative boost: If it's a very strong match (>0.6), 
            # boost it so users' "100%" setting doesn't fail on "95%" results
            if top_score > 0.65:
                confidence = min(98, confidence + 15)
            elif top_score > 0.5:
                confidence = min(90, confidence + 10)
                
            # Ensure we don't return 0 if there are chunks
            if top_chunks and confidence < 40 and top_score > 0.3:
                confidence = 45 # Minimum viable for "match"
                
            return {
                'answer': answer,
                'confidence': confidence,
                'intent': 'content_based',
                'sources': sources,
                'metadata': {
                    'top_score': top_score,
                    'query_used': query,
                    'is_grounded': True
                }
            }
        except Exception as e:
            logger.error(f"❌ LLM error: {e}")
            import traceback
            logger.debug(traceback.format_exc())
            return {
                'answer': "I'm having trouble retrieving that information right now. Please try again later.",
                'confidence': 0,
                'sources': [],
                'intent': 'error'
            }

    def _recontextualize_query(self, query: str, history: List[Dict[str, str]]) -> str:
        """
        Use LLM to rewrite a follow-up query based on chat history.
        e.g. "Is it open source?" -> "Is HuggingFace open source?"
        """
        if not history:
            return query
            
        # Format history string
        history_str = ""
        for msg in history[-3:]: # Last 3 messages for context
            role = "User" if msg.get("role") == "user" else "Assistant"
            history_str += f"{role}: {msg.get('content')}\n"
            
        recontext_prompt = (
            "Given the following conversation history and a NEW question, rewrite the NEW question to be standalone and self-contained.\n"
            "If the NEW question refers to 'it', 'this', 'that', or other context, replace them with the correct entity from the history.\n"
            "Output ONLY the rewritten question. If no change is needed, output the NEW question as is.\n\n"
            f"--- HISTORY ---\n{history_str}\n"
            f"NEW QUESTION: {query}\n\n"
            "REWRITTEN STANDALONE QUESTION:"
        )
        
        try:
            rewritten = self.llm_agent._call_llm([
                {"role": "system", "content": "You are a query pre-processor. Rewrite questions to be standalone."},
                {"role": "user", "content": recontext_prompt}
            ])
            if rewritten and len(rewritten.strip()) > 3:
                # Clean up if LLM added quotes or "Rewritten:" prefix
                rewritten = re.sub(r'^["\']|["\']$', '', rewritten.strip())
                rewritten = re.sub(r'^(Rewritten Question|Standalone Question):\s*', '', rewritten, flags=re.IGNORECASE)
                return rewritten.strip()
        except Exception as e:
            logger.warning(f"⚠️ Query re-contextualization failed: {e}")
            
        return query
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the RAG agent"""
        doc_stats = self.doc_store.get_stats()
        faq_stats = self.faq_store.get_stats()
        
        return {
            'agent_id': self.agent_id,
            'vector_store': doc_stats, # Primary store for compatibility with main.py
            'faq_store': faq_stats,
            'llm_available': self.llm_agent.is_available() if self.llm_agent and hasattr(self.llm_agent, 'is_available') else False
        }

    def rename_agent(self, new_agent_id: str) -> bool:
        """Rename both doc and faq stores for a new agent ID"""
        res1 = self.doc_store.rename_agent(new_agent_id)
        res2 = self.faq_store.rename_agent(new_agent_id)
        self.agent_id = new_agent_id
        return res1 and res2

    def _deduplicate_sources(self, sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate sources by URL while keeping highest relevance."""
        seen_urls = {}
        for source in sources:
            url = source.get('url')
            if not url:
                continue
            if url not in seen_urls or source.get('relevance', 0) > seen_urls[url].get('relevance', 0):
                seen_urls[url] = source
        return list(seen_urls.values())
