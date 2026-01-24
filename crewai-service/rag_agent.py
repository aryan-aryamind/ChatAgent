"""
RAG Agent - Complete RAG pipeline with vector store, semantic search, and LLM generation.
Integrates chunking, embedding, vector storage, and answer generation.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from vector_store import VectorStore
from chunking import SemanticChunker
from agents.llm_agent import LLMAgent

logger = logging.getLogger(__name__)


class RAGAgent:
    """
    Complete RAG (Retrieval Augmented Generation) agent.
    Handles chunking, embedding, vector storage, semantic search, and answer generation.
    """
    
    def __init__(
        self,
        agent_id: str,
        llm_agent: Optional[LLMAgent] = None,
        chunk_size: int = 400,
        vector_store_dir: str = "vector_storage"
    ):
        """
        Initialize RAG agent.
        
        Args:
            agent_id: Unique identifier for the agent
            llm_agent: LLM agent instance (optional, will create if None)
            chunk_size: Target chunk size in tokens
            vector_store_dir: Directory for vector store
        """
        self.agent_id = agent_id
        self.llm_agent = llm_agent or LLMAgent()
        
        # Initialize components
        self.chunker = SemanticChunker(chunk_size=chunk_size)
        self.vector_store = VectorStore(
            agent_id=agent_id,
            storage_dir=vector_store_dir
        )
        
        logger.info(f"✅ RAG Agent initialized for agent: {agent_id}")
    
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
        
        # Add chunks to vector store
        chunks_added = self.vector_store.add_chunks(chunks, batch_size=batch_size)
        
        stats = {
            'pages_indexed': len(pages),
            'chunks_created': len(chunks),
            'chunks_indexed': chunks_added
        }
        
        logger.info(f"✅ Indexing complete: {chunks_added} chunks indexed")
        return stats
    
    def search(
        self,
        query: str,
        top_k: int = 5,
        min_similarity: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search over indexed content.
        
        Args:
            query: User query
            top_k: Number of top results
            min_similarity: Minimum similarity threshold (0-1)
        
        Returns:
            List of relevant chunks with similarity scores
        """
        return self.vector_store.search(query, top_k=top_k, min_similarity=min_similarity)
    
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
        # Build system prompt with strict instructions
        system_prompt = """You are a helpful assistant that answers questions based ONLY on the provided context.

CRITICAL RULES:
1. Answer using ONLY the information in the CONTEXT below.
2. DO NOT use any external knowledge or make assumptions.
3. If the context doesn't contain enough information to answer, say: "I don't have enough information in the provided content to answer that question."
4. Be concise (2-3 sentences maximum).
5. If asked about pricing, features, or policies, quote or paraphrase exactly from the context.
6. Do NOT invent or guess information.

CONTEXT FROM WEBSITE:
"""
        
        # Build context from chunks
        context_parts = []
        sources = []
        current_length = len(system_prompt)
        
        for i, chunk in enumerate(chunks):
            chunk_text = chunk.get('text', '')
            chunk_url = chunk.get('url', '')
            chunk_title = chunk.get('title', '')
            similarity = chunk.get('similarity_score', 0)
            
            # Format chunk with source info
            chunk_context = f"\n[Source {i+1}: {chunk_title} ({chunk_url})]\n{chunk_text}\n"
            
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
        user_question = f"\n\nUSER QUESTION: {query}\n\nANSWER (based ONLY on context above):"
        
        full_prompt = system_prompt + context + user_question
        
        return full_prompt, sources
    
    def answer(
        self,
        query: str,
        top_k: int = 5,
        min_similarity: float = 0.3,
        confidence_threshold: float = 0.35,
        max_context_length: int = 2000
    ) -> Dict[str, Any]:
        """
        Complete RAG pipeline: search → retrieve → generate answer.
        
        Args:
            query: User question
            top_k: Number of chunks to retrieve
            min_similarity: Minimum similarity for retrieval
            confidence_threshold: Minimum similarity to generate answer (else fallback)
            max_context_length: Max characters in context
        
        Returns:
            Dictionary with answer, confidence, sources, and metadata
        """
        # Step 1: Semantic search
        logger.info(f"🔍 Searching for: '{query}'")
        relevant_chunks = self.search(query, top_k=top_k, min_similarity=min_similarity)
        
        if not relevant_chunks:
            return {
                'answer': "I couldn't find any relevant information in the stored content to answer your question.",
                'confidence': 0,
                'sources': [],
                'intent': 'no_match',
                'metadata': {
                    'chunks_found': 0,
                    'reason': 'no_relevant_chunks'
                }
            }
        
        # Step 2: Check confidence threshold
        top_similarity = relevant_chunks[0].get('similarity_score', 0)
        
        if top_similarity < confidence_threshold:
            logger.info(f"⚠️  Top similarity {top_similarity:.2f} below threshold {confidence_threshold}")
            return {
                'answer': "I don't have enough relevant information in the stored content to confidently answer that question. Could you rephrase or ask about something else?",
                'confidence': int(top_similarity * 100),
                'sources': [{
                    'url': chunk.get('url', ''),
                    'title': chunk.get('title', ''),
                    'relevance': chunk.get('similarity_score', 0)
                } for chunk in relevant_chunks[:3]],
                'intent': 'low_confidence',
                'metadata': {
                    'chunks_found': len(relevant_chunks),
                    'top_similarity': top_similarity,
                    'reason': 'below_threshold'
                }
            }
        
        # Step 3: Build grounded prompt
        prompt, sources = self.build_prompt(query, relevant_chunks, max_context_length)
        
        # Step 4: Generate answer using LLM
        try:
            logger.info(f"🤖 Generating answer with LLM (top similarity: {top_similarity:.2f})")
            answer = self.llm_agent.generate_answer_from_content(
                user_query=query,
                context=prompt  # Pass full prompt as context
            )
            
            # Calculate average confidence from top chunks
            avg_confidence = sum(c.get('similarity_score', 0) for c in relevant_chunks[:3]) / min(3, len(relevant_chunks))
            confidence_percent = int(min(avg_confidence * 100, 100))
            
            return {
                'answer': answer,
                'confidence': confidence_percent,
                'sources': sources,
                'intent': 'content_based',
                'metadata': {
                    'chunks_found': len(relevant_chunks),
                    'top_similarity': top_similarity,
                    'chunks_used': len(sources),
                    'llm_used': True
                }
            }
            
        except Exception as e:
            logger.error(f"❌ LLM generation error: {e}")
            # Fallback: return most relevant chunk directly
            best_chunk = relevant_chunks[0]
            return {
                'answer': best_chunk.get('text', '')[:500] + "...",
                'confidence': int(best_chunk.get('similarity_score', 0) * 100),
                'sources': [{
                    'url': best_chunk.get('url', ''),
                    'title': best_chunk.get('title', ''),
                    'relevance': best_chunk.get('similarity_score', 0)
                }],
                'intent': 'content_based',
                'metadata': {
                    'chunks_found': len(relevant_chunks),
                    'top_similarity': top_similarity,
                    'llm_used': False,
                    'reason': 'llm_error'
                }
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the RAG agent"""
        vector_stats = self.vector_store.get_stats()
        return {
            'agent_id': self.agent_id,
            'vector_store': vector_stats,
            'llm_available': self.llm_agent.available if self.llm_agent else False
        }
