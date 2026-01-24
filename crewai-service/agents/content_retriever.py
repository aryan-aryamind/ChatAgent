"""
Content Retriever Agent - Retrieves relevant content chunks for RAG-based answering.
Uses semantic similarity to find the most relevant content from stored website data.
"""

from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
import numpy as np


class ContentRetrieverAgent:
    """Retrieves relevant content chunks using semantic similarity"""
    
    def __init__(self):
        # Use a lightweight model for semantic search
        try:
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Content retriever initialized with semantic model")
        except Exception as e:
            print(f"⚠️  Could not load semantic model: {e}")
            self.model = None
    
    def find_relevant_chunks(
        self, 
        query: str, 
        content_chunks: List[Dict[str, Any]], 
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Find the most relevant content chunks for a query using semantic similarity.
        
        Args:
            query: User's question/query
            content_chunks: List of content chunks with 'text' field
            top_k: Number of top chunks to return
        
        Returns:
            List of relevant chunks with similarity scores
        """
        if not content_chunks or not self.model:
            # Fallback: simple keyword matching
            return self._keyword_match(query, content_chunks, top_k)
        
        try:
            # Encode query
            query_embedding = self.model.encode([query], convert_to_numpy=True)
            
            # Encode all chunks
            chunk_texts = [chunk.get("text", "") for chunk in content_chunks]
            chunk_embeddings = self.model.encode(chunk_texts, convert_to_numpy=True)
            
            # Calculate cosine similarity
            similarities = np.dot(chunk_embeddings, query_embedding.T).flatten()
            
            # Get top K chunks
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            # Return top chunks with scores
            results = []
            for idx in top_indices:
                chunk = content_chunks[idx].copy()
                chunk["similarity_score"] = float(similarities[idx])
                results.append(chunk)
            
            return results
            
        except Exception as e:
            print(f"⚠️  Error in semantic search: {e}, falling back to keyword matching")
            return self._keyword_match(query, content_chunks, top_k)
    
    def _keyword_match(
        self, 
        query: str, 
        content_chunks: List[Dict[str, Any]], 
        top_k: int
    ) -> List[Dict[str, Any]]:
        """Fallback keyword matching when semantic model is unavailable"""
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        scored_chunks = []
        for chunk in content_chunks:
            text = chunk.get("text", "").lower()
            # Count matching words
            matches = sum(1 for word in query_words if word in text)
            score = matches / len(query_words) if query_words else 0
            
            if score > 0:
                chunk_copy = chunk.copy()
                chunk_copy["similarity_score"] = score
                scored_chunks.append(chunk_copy)
        
        # Sort by score and return top K
        scored_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_chunks[:top_k]
