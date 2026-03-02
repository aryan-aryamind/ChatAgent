import os
import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from vector_store import VectorStore
from chunking import SemanticChunker
from agents.llm_agent import LLMAgent
from sentence_transformers import SentenceTransformer, CrossEncoder
from agents.qa_matcher import QAMatcherAgent
from agents.intent_classifier import IntentClassifierAgent
from agents.synthesis_agent import SynthesisAgent

logger = logging.getLogger(__name__)


class RAGAgent:
    """
    RAG Coordinator Agent.
    Orchestrates the flow between classification, retrieval, and synthesis.
    """
    
    JUNK_NON_ASCII_THRESHOLD = 0.3
    
    RECONTEXTUALIZER_PROMPT = """### Business Context
{company_name} customer support conversation history.

### Role
- Primary Function: You are a **Conversation Context Engine**. Your task is to rewrite the 'NEW QUESTION' into a standalone, self-explanatory prompt.
- Rewriting Rules:
  1. If 'NEW QUESTION' is an affirmation (yes/sure), rewrite it to reflect the specific task or comparison suggested by the Assistant.
  2. If 'NEW QUESTION' refers to 'it', 'this', or 'above', replace them with specific product names from the history.
  3. If 'NEW QUESTION' is already self-contained, return it as is.

### Persona
- Identity: You are a precise, background utility agent. You do not talk to the user. You ONLY output the rewritten prompt.

### Constraints
1. **Output Format**: Output ONLY the rewritten question. No explanations.
2. No Data Divulge: Never mention training data or your logic.

### HISTORY:
{history}

### NEW QUESTION:
{query}
"""

    # Static cache for reranker model (Memory leak fix)
    _reranker_cache = None
    _reranker_failed = False

    def __init__(
        self,
        agent_id: str,
        llm_agent: Optional[Any] = None,
        chunk_size: int = 400,
        storage_dir: str = "vector_storage",
        base_company_info: str = "",
        persona_type: str = "general"
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
        
        # Modular Specialized Agents
        self.classifier = IntentClassifierAgent(self.llm_agent)
        self.synthesizer = SynthesisAgent(self.llm_agent, company_name=self.company_name, base_info=self.base_company_info, persona_type=persona_type)
        
        # Ensure persona and reranker are fully initialized
        self.set_persona(persona_type)
        
    def set_persona(self, persona_type: str):
        """Update the persona for this coordinated agent."""
        self.synthesizer.set_persona(persona_type)
        
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
        
        logger.info(f"✅ RAG Agent initialized for agent: {self.agent_id}")

    def _infer_company_name(self) -> str:
        """Infer company name from base_info or agent_id"""
        if self.base_company_info:
            if "MedTrust" in self.base_company_info:
                return "MedTrust"
            
            # If base_info is a technical ID itself, ignore it
            if "temp_" in self.base_company_info or "aHR0" in self.base_company_info:
                pass 
            elif "https://" in self.base_company_info:
                match = re.search(r'https?://([^/]+)', self.base_company_info)
                if match:
                    domain = match.group(1).replace("www.", "")
                    if "huggingface.co" in domain: return "HuggingFace"
                    if "formula1.com" in domain: return "Formula 1"
                    return domain.split('.')[0].capitalize()

        # Fallback to agent_id if it's not a timestamp or technical ID
        if hasattr(self, 'agent_id'):
            aid = str(self.agent_id)
            # Filter technical IDs: digits, temp_, agent_, or long random strings
            is_technical = (
                aid.isdigit() or 
                aid.startswith(('temp_', 'agent_', 'bot_')) or
                len(aid) > 25 or
                "aHR0" in aid # Base64 'http' marker
            )
            if not is_technical:
                return aid.capitalize()
        
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
    def _extract_clean_answer_from_chunk(text: str, max_chars: int = 350) -> str:
        """
        Extract meaningful sentences from raw chunk text.
        Prioritizes technical details over general definitions.
        """
        if not text or len(text.strip()) < 15:
            return text.strip()[:max_chars] if text else ""
            
        text = re.sub(r'\s+', ' ', text.strip())
        sentences = re.split(r'(?<=[.!?])\s+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 15]
        
        # Focus on specs, features, and values rather than "is a product" definitions
        feature_markers = (
            r"\b(?:ghz|dpi|sensor|buttons|usb|wireless|battery|gaming|office|wired)\b",
            r"\b(?:features|includes|specifications|compatible|compatible with)\b",
            r"\b(?:high-precision|ergonomic|durable|adjustable)\b",
        )
        
        chosen = []
        for s in sentences:
            if any(re.search(m, s, re.I) for m in feature_markers):
                chosen.append(s)
                if len(chosen) >= 3: # Keep up to 3 feature sentences
                    break
        
        if not chosen:
            chosen = sentences[:2]
            
        result = ' '.join(chosen).strip()
        if len(result) > max_chars:
            result = result[:max_chars].rsplit(' ', 1)[0].rstrip('.,;') + "..."
            
        return result
    
    def index_content(self, pages: List[Dict[str, Any]], batch_size: int = 32) -> Dict[str, Any]:
        """Index scraped pages into vector store."""
        logger.info(f"🔄 Indexing {len(pages)} pages for agent {self.agent_id}...")
        chunks = self.chunker.chunk_pages(pages)
        if not chunks: return {'pages_indexed': len(pages), 'chunks_indexed': 0}
        
        filtered_chunks = [c for c in chunks if not self.is_junk_text(c.get("text", ""))]
        if not filtered_chunks: return {'pages_indexed': len(pages), 'chunks_indexed': 0, 'status': 'error_content_corrupted'}

        chunks_added = self.doc_store.add_chunks(filtered_chunks, batch_size=batch_size)
        return {'pages_indexed': len(pages), 'chunks_created': len(chunks), 'chunks_indexed': chunks_added}
    
    def search_docs(self, query: str, top_k: int = 10, min_similarity: float = 0.3) -> List[Dict[str, Any]]:
        return self.doc_store.search(query, top_k=top_k, min_similarity=min_similarity)

    def search_faq(self, query: str, top_k: int = 5, min_similarity: float = 0.4) -> List[Dict[str, Any]]:
        return self.faq_store.search(query, top_k=top_k, min_similarity=min_similarity)

    def index_faq(self, qa_pairs: List[Dict[str, Any]]) -> int:
        if not qa_pairs: return 0
        current_stats = self.faq_store.get_stats()
        if current_stats.get('total_chunks', 0) == len(qa_pairs): return 0
        if current_stats.get('total_chunks', 0) > 0: self.faq_store.delete_index()
        chunks = [{'chunk_id': f"faq-{i}", 'question': qa['question'], 'answer': qa['answer'], 'text': f"Question: {qa['question']}\nAnswer: {qa['answer']}", 'is_qa': True, 'url': 'Manual FAQ'} for i, qa in enumerate(qa_pairs) if qa.get('question') and qa.get('answer')]
        return self.faq_store.add_chunks(chunks)

    def rewrite_query(self, query: str) -> str:
        """Improve keyword detection for better semantic hits"""
        q = query.lower().strip()
        if any(w in q for w in ["where", "location", "address"]) and "address" not in q: q += " location address"
        if any(w in q for w in ["contact", "phone", "number", "email"]) and "contact" not in q: q += " contact information"
        return q

    def answer(
        self,
        query: str,
        history: List[Dict[str, str]] = None,
        qa_pairs: List[Dict[str, Any]] = None,
        max_context_length: int = 2500,
        min_similarity: float = 0.1,
        persona_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Coordinated Answer Pipeline (Modular)
        """
        # 1. Identity Boosting & Rewriting
        query = self.rewrite_query(query)
        if history and len(history) > 0:
            query = self._recontextualization(query, history)
        
        # 2. Intent Classification (Specialized Agent)
        intent_info = self.classifier.classify(query, qa_pairs or [])
        logger.info(f"🎯 Intent: {intent_info['intent']} ({intent_info['confidence']:.2f})")
        
        # 3. Retrieval (Increased Recall)
        if qa_pairs: self.index_faq(qa_pairs)
        faq_hits = self.search_faq(query, top_k=3, min_similarity=0.1)
        doc_hits = self.search_docs(query, top_k=20, min_similarity=0.1)
        
        # 4. Re-ranking (Delegating Precision to Re-ranker)
        final_chunks = self._rerank_and_merge(query, doc_hits, faq_hits)

        # 5. Synthesis (Modular synthesis with specialized Prompt)
        result = self.synthesizer.synthesize(
            query=query, 
            chunks=final_chunks, 
            max_chars=max_context_length, 
            intent=intent_info['intent'],
            persona_type=persona_type,
            history=history
        )
        result['intent'] = intent_info['intent']
        return result

    def _recontextualization(self, query: str, history: List[Dict[str, str]]) -> str:
        hist_str = "\n".join([f"{'User' if m['role']=='user' else 'Assistant'}: {m['content']}" for m in history[-3:]])
        prompt = self.RECONTEXTUALIZER_PROMPT.format(history=hist_str, query=query, company_name=self.company_name)
        rewritten = self.llm_agent.chat("You are a standalone question rewriter.", prompt, max_tokens=100)
        if rewritten:
            rewritten = rewritten.strip().strip('"').strip("'")
            return rewritten if len(rewritten) > 1 else query
        return query

    def _rerank_and_merge(self, query: str, doc_hits: List[Dict], faq_hits: List[Dict]) -> List[Dict]:
        """
        Merge and rerank hits. Prioritize accuracy over source type.
        """
        # Combine all candidates
        all_hits = []
        for h in faq_hits:
            h['_priority_boost'] = 0.2  # Slight boost for FAQs as they are curated
            all_hits.append(h)
        all_hits.extend(doc_hits)

        if not all_hits:
            return []

        if self.reranker:
            # Prepare pairs for reranking
            pairs = [[query, h.get('text', '')] for h in all_hits if len(h.get('text', '')) > 10]
            if pairs:
                scores = self.reranker.predict(pairs)
                for i, s in enumerate(scores):
                    # Combine rerank score with priority boost
                    boost = all_hits[i].get('_priority_boost', 0)
                    score = float(s) + boost
                    
                    # Reranking Penalty for 'Combos' when user asks for a single item
                    title = all_hits[i].get('title', '').lower()
                    text = all_hits[i].get('text', '').lower()
                    is_combo_page = any(w in title or w in text for w in ['combo', 'kit', 'set', 'collection', 'archives'])
                    
                    # If query is specifically about 'mouse' or 'keyboard' but NOT 'combo'
                    q_lower = query.lower()
                    if is_combo_page and any(w in q_lower for w in ['mouse', 'keyboard']) and 'combo' not in q_lower:
                        score -= 0.15 # Small penalty to favor standalone products
                        
                    all_hits[i]['rerank_score'] = score
                
                all_hits.sort(key=lambda x: x.get('rerank_score', -10), reverse=True)
                return all_hits[:10]
        
        # Fallback to simple merge if reranker is unavailable
        return all_hits[:10]

    def get_stats(self) -> Dict[str, Any]:
        return {
            'agent_id': self.agent_id,
            'vector_store': self.doc_store.get_stats(),
            'faq_store': self.faq_store.get_stats(),
            'llm_available': self.llm_agent.available if self.llm_agent and hasattr(self.llm_agent, 'available') else False
        }

    def rename_agent(self, new_agent_id: str) -> bool:
        res1 = self.doc_store.rename_agent(new_agent_id)
        res2 = self.faq_store.rename_agent(new_agent_id)
        self.agent_id = new_agent_id
        return res1 and res2
