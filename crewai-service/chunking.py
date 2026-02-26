"""
Semantic Chunking Module - Splits text into semantically meaningful chunks.
Uses sentence boundaries and token limits for better chunk quality.
"""

import re
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class SemanticChunker:
    """
    Chunks text into semantically meaningful pieces.
    Preserves sentence boundaries and respects token limits.
    """
    
    def __init__(
        self,
        chunk_size: int = 600,  # Roadmap: 400-700 tokens
        chunk_overlap: int = 100,  # Roadmap: 100 tokens
        min_chunk_size: int = 50   # Minimum meaningful text
    ):
        """
        Initialize chunker with production-level defaults.
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
    
    def _estimate_tokens(self, text: str) -> int:
        """
        Slightly better token estimation (1 token ≈ 3.5 characters for technical text).
        In production, use tiktoken for GPT models.
        """
        return int(len(text) / 3.5)
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences using regex.
        Preserves sentence boundaries for better semantic chunks.
        """
        # Pattern to match sentence endings
        sentence_pattern = r'(?<=[.!?])\s+'
        sentences = re.split(sentence_pattern, text)
        
        # Filter out empty sentences
        return [s.strip() for s in sentences if s.strip()]
    
    def chunk_text(
        self,
        text: str,
        url: str = "",
        title: str = "",
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Chunk text into semantically meaningful pieces.
        
        Args:
            text: Text to chunk
            url: Source URL
            title: Source title
            metadata: Additional metadata to attach to chunks
        
        Returns:
            List of chunk dictionaries with text and metadata
        """
        if not text or not text.strip():
            return []
        
        # Split into sentences first
        sentences = self._split_into_sentences(text)
        
        if not sentences:
            return []
        
        chunks = []
        current_chunk = []
        current_tokens = 0
        chunk_id = 0
        
        for sentence in sentences:
            sentence_tokens = self._estimate_tokens(sentence)
            
            # If single sentence is too large, split it further
            if sentence_tokens > self.chunk_size:
                # Split long sentence by commas or other punctuation
                parts = re.split(r'[,;]\s+', sentence)
                for part in parts:
                    part_tokens = self._estimate_tokens(part)
                    
                    if current_tokens + part_tokens > self.chunk_size and current_chunk:
                        # Save current chunk
                        chunk_text = ' '.join(current_chunk)
                        if self._estimate_tokens(chunk_text) >= self.min_chunk_size:
                            chunks.append({
                                'chunk_id': f"{url}-chunk-{chunk_id}",
                                'text': chunk_text,
                                'url': url,
                                'title': title,
                                'metadata': metadata or {}
                            })
                            chunk_id += 1
                        
                        # Start new chunk with overlap
                        overlap_tokens = min(self.chunk_overlap, current_tokens)
                        if overlap_tokens > 0:
                            # Keep last few sentences for overlap
                            overlap_sentences = current_chunk[-2:] if len(current_chunk) >= 2 else current_chunk
                            current_chunk = overlap_sentences + [part]
                            current_tokens = sum(self._estimate_tokens(s) for s in current_chunk)
                        else:
                            current_chunk = [part]
                            current_tokens = part_tokens
                    else:
                        current_chunk.append(part)
                        current_tokens += part_tokens
            else:
                # Check if adding this sentence would exceed chunk size
                if current_tokens + sentence_tokens > self.chunk_size and current_chunk:
                    # Save current chunk
                    chunk_text = ' '.join(current_chunk)
                    if self._estimate_tokens(chunk_text) >= self.min_chunk_size:
                        chunks.append({
                            'chunk_id': f"{url}-chunk-{chunk_id}",
                            'text': chunk_text,
                            'url': url,
                            'title': title,
                            'metadata': metadata or {}
                        })
                        chunk_id += 1
                    
                    # Start new chunk with overlap
                    overlap_tokens = min(self.chunk_overlap, current_tokens)
                    if overlap_tokens > 0:
                        # Keep last sentence(s) for overlap
                        overlap_sentences = current_chunk[-1:] if current_chunk else []
                        current_chunk = overlap_sentences + [sentence]
                        current_tokens = sum(self._estimate_tokens(s) for s in current_chunk)
                    else:
                        current_chunk = [sentence]
                        current_tokens = sentence_tokens
                else:
                    # Add sentence to current chunk
                    current_chunk.append(sentence)
                    current_tokens += sentence_tokens
        
        # Add final chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            if self._estimate_tokens(chunk_text) >= self.min_chunk_size:
                chunks.append({
                    'chunk_id': f"{url}-chunk-{chunk_id}",
                    'text': chunk_text,
                    'url': url,
                    'title': title,
                    'metadata': metadata or {}
                })
        
        logger.info(f"📦 Chunked text into {len(chunks)} chunks (avg ~{self.chunk_size} tokens)")
        return chunks
    
    def chunk_pages(
        self,
        pages: List[Dict[str, Any]],
        chunk_size: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Chunk multiple pages into semantic chunks.
        
        Args:
            pages: List of page dictionaries with 'main_content', 'url', 'title', etc.
            chunk_size: Override default chunk size
        
        Returns:
            List of all chunks from all pages
        """
        if chunk_size:
            self.chunk_size = chunk_size
        
        all_chunks = []
        
        for page in pages:
            text = page.get('main_content', '') or page.get('content', '')
            url = page.get('url', '')
            title = page.get('title', '')
            
            # Extract additional metadata
            metadata = {
                'depth': page.get('depth', 0),
                'headings': page.get('headings', []),
                'meta_description': page.get('meta_description'),
                'scraped_at': page.get('timestamp', '')
            }
            
            # Chunk this page
            page_chunks = self.chunk_text(text, url, title, metadata)
            all_chunks.extend(page_chunks)
        
        logger.info(f"📦 Total chunks created: {len(all_chunks)} from {len(pages)} pages")
        return all_chunks
