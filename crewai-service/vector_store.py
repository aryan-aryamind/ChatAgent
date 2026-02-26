"""
Vector Store Module - Manages embeddings and semantic search using FAISS.
Persists embeddings for fast retrieval without recomputing each time.
"""

import faiss
import numpy as np
import json
import pickle
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)


class VectorStore:
    """
    Manages vector embeddings and semantic search using FAISS.
    Persists embeddings to disk for fast retrieval.
    """
    
    # Static cache for models to avoid reloading on every request (Memory leak fix)
    _model_cache = {}
    def __init__(
        self,
        agent_id: str,
        storage_dir: str = "vector_storage",
        model_name: str = "BAAI/bge-base-en-v1.5",
        index_type: str = "docs" # New: support 'docs' or 'faq'
    ):
        """
        Initialize vector store for an agent.
        
        Args:
            agent_id: Unique identifier for the agent
            storage_dir: Directory to store vector indices
            model_name: Sentence Transformer model name
            index_type: Type of index ('docs' or 'faq')
        """
        self.agent_id = agent_id
        self.index_type = index_type
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True, parents=True)
        
        # Initialize embedding model (using static cache)
        if model_name not in VectorStore._model_cache:
            try:
                VectorStore._model_cache[model_name] = SentenceTransformer(model_name)
                logger.info(f"✅ Loaded embedding model into cache: {model_name}")
            except Exception as e:
                logger.error(f"❌ Failed to load embedding model: {e}")
                raise
        
        self.model = VectorStore._model_cache[model_name]
        
        # FAISS index (will be initialized when chunks are added)
        self.index: Optional[faiss.Index] = None
        self.dimension = self.model.get_sentence_embedding_dimension()
        
        # Metadata storage (maps index position to chunk metadata)
        self.metadata: List[Dict[str, Any]] = []
        
        # File paths (now including index_type)
        # Standardization: Always use type suffix for new indices, 
        # but check for old ones during loading
        self.index_path = self.storage_dir / f"{agent_id}_{index_type}.index"
        self.metadata_path = self.storage_dir / f"{agent_id}_{index_type}_metadata.json"
        
        # Fallback for older indices (without _type suffix)
        if not self.index_path.exists() and (self.storage_dir / f"{agent_id}.index").exists():
            old_index = self.storage_dir / f"{agent_id}.index"
            old_meta = self.storage_dir / f"{agent_id}_metadata.json"
            if old_index.exists():
                import shutil
                shutil.copy(str(old_index), str(self.index_path))
                if old_meta.exists():
                    shutil.copy(str(old_meta), str(self.metadata_path))
                logger.info(f"📑 Migrated legacy index for agent {agent_id}")
        
        # Load existing index if available
        self._load_index()
    
    def _load_index(self):
        """Load existing FAISS index and metadata from disk"""
        try:
            if self.index_path.exists() and self.metadata_path.exists():
                # Load FAISS index
                self.index = faiss.read_index(str(self.index_path))
                
                # Load metadata
                with open(self.metadata_path, 'r', encoding='utf-8') as f:
                    self.metadata = json.load(f)
                
                logger.info(f"✅ Loaded existing {self.index_type} index for agent {self.agent_id}: {len(self.metadata)} chunks")
            else:
                # Create new index
                self.index = faiss.IndexFlatL2(self.dimension)  # L2 distance for cosine similarity
                logger.info(f"📝 Created new {self.index_type} index for agent {self.agent_id}")
        except Exception as e:
            logger.error(f"❌ Error loading index: {e}")
            # Create new index on error
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = []
    
    def _save_index(self):
        """Save FAISS index and metadata to disk"""
        try:
            if self.index and len(self.metadata) > 0:
                # Save FAISS index
                faiss.write_index(self.index, str(self.index_path))
                
                # Save metadata
                with open(self.metadata_path, 'w', encoding='utf-8') as f:
                    json.dump(self.metadata, f, indent=2, ensure_ascii=False)
                
                logger.info(f"💾 Saved {self.index_type} index: {len(self.metadata)} chunks")
        except Exception as e:
            logger.error(f"❌ Error saving index: {e}")
    
    def add_chunks(
        self,
        chunks: List[Dict[str, Any]],
        batch_size: int = 32
    ) -> int:
        """
        Add chunks to the vector store.
        
        Args:
            chunks: List of chunk dictionaries with 'text', 'url', 'title', etc.
            batch_size: Batch size for embedding computation
        
        Returns:
            Number of chunks added
        """
        if not chunks:
            return 0
        
        # Extract texts for embedding
        texts = [chunk.get('text', '') for chunk in chunks]
        
        # Filter out empty texts
        valid_chunks = []
        valid_texts = []
        for chunk, text in zip(chunks, texts):
            if text and text.strip():
                valid_chunks.append(chunk)
                valid_texts.append(text.strip())
        
        if not valid_texts:
            logger.warning("No valid chunks to add")
            return 0
        
        # Embed texts in batches for efficiency
        logger.info(f"🔄 Embedding {len(valid_texts)} chunks...")
        embeddings = []
        
        for i in range(0, len(valid_texts), batch_size):
            batch = valid_texts[i:i + batch_size]
            batch_embeddings = self.model.encode(
                batch,
                convert_to_numpy=True,
                show_progress_bar=False,
                normalize_embeddings=True  # Normalize for cosine similarity
            )
            embeddings.append(batch_embeddings)
        
        # Concatenate all embeddings
        all_embeddings = np.vstack(embeddings).astype('float32')
        
        # Add to FAISS index
        if self.index is None:
            self.index = faiss.IndexFlatL2(self.dimension)
        
        # Normalize embeddings for cosine similarity (FAISS uses L2, so we normalize)
        faiss.normalize_L2(all_embeddings)
        self.index.add(all_embeddings)
        
        # Store metadata
        for chunk in valid_chunks:
            # Create metadata entry with all original fields
            chunk_metadata = chunk.copy()
            chunk_metadata.update({
                'chunk_index': len(self.metadata)  # Position in index
            })
            self.metadata.append(chunk_metadata)
        
        # Save to disk
        self._save_index()
        
        logger.info(f"✅ Added {len(valid_chunks)} chunks to vector store")
        return len(valid_chunks)
    
    def search(
        self,
        query: str,
        top_k: int = 5,
        min_similarity: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Search for similar chunks using semantic similarity.
        
        Args:
            query: User query string
            top_k: Number of top results to return
            min_similarity: Minimum similarity threshold (0-1)
        
        Returns:
            List of chunks with similarity scores, sorted by relevance
        """
        if self.index is None or len(self.metadata) == 0:
            logger.warning("Vector index is empty")
            return []
        
        # Embed query
        query_embedding = self.model.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True
        ).astype('float32')
        
        # Normalize for cosine similarity
        faiss.normalize_L2(query_embedding)
        
        # Search in FAISS index
        # FAISS returns L2 distances, we convert to cosine similarity
        k = min(top_k, len(self.metadata))
        distances, indices = self.index.search(query_embedding, k)
        
        # Convert L2 distances to cosine similarity scores
        # Cosine similarity = 1 - (L2_distance^2 / 2) for normalized vectors
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < 0 or idx >= len(self.metadata):  # Invalid index
                continue
            
            # Convert L2 distance to cosine similarity
            # For normalized vectors: cosine_sim = 1 - (L2^2 / 2)
            cosine_similarity = 1.0 - (distance ** 2 / 2.0)
            cosine_similarity = max(0.0, min(1.0, cosine_similarity))  # Clamp to [0, 1]
            
            if cosine_similarity >= min_similarity:
                chunk_data = self.metadata[idx].copy()
                chunk_data['similarity_score'] = float(cosine_similarity)
                chunk_data['rank'] = i + 1
                results.append(chunk_data)
        
        # Sort by similarity (descending)
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return results
    
    def delete_index(self) -> bool:
        """Delete the vector index for this agent"""
        try:
            if self.index_path.exists():
                self.index_path.unlink()
            if self.metadata_path.exists():
                self.metadata_path.unlink()
            
            self.index = None
            self.metadata = []
            
            logger.info(f"🗑️  Deleted vector index for agent {self.agent_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error deleting index: {e}")
            return False
    
    def rename_agent(self, new_agent_id: str) -> bool:
        """Rename the agent ID and move files on disk"""
        try:
            new_index_path = self.storage_dir / f"{new_agent_id}_{self.index_type}.index"
            new_metadata_path = self.storage_dir / f"{new_agent_id}_{self.index_type}_metadata.json"
            
            if self.index_path.exists():
                self.index_path.rename(new_index_path)
            if self.metadata_path.exists():
                self.metadata_path.rename(new_metadata_path)
            
            self.agent_id = new_agent_id
            self.index_path = new_index_path
            self.metadata_path = new_metadata_path
            
            logger.info(f"🏷️  Renamed {self.index_type} index to agent {new_agent_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error renaming index: {e}")
            return False
            
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store"""
        return {
            'agent_id': self.agent_id,
            'total_chunks': len(self.metadata),
            'dimension': self.dimension,
            'index_exists': self.index is not None and len(self.metadata) > 0
        }
