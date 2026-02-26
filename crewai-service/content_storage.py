"""
Content Storage System - Stores scraped website content for RAG-based answering.
Uses JSON format to store all scraped pages with their content.
"""

import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path


class ContentStorage:
    """Manages storage and retrieval of scraped website content"""
    
    def __init__(self, storage_dir: str = "content_storage"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
    
    def _get_file_path(self, agent_id: str) -> Path:
        """Get file path for agent's content"""
        return self.storage_dir / f"{agent_id}.json"
    
    def save_content(self, agent_id: str, scraped_content: Dict[str, Any]) -> bool:
        """
        Save scraped content to JSON file.
        
        Args:
            agent_id: Unique identifier for the agent
            scraped_content: Dictionary containing scraped content from scraper
        
        Returns:
            True if successful
        """
        try:
            file_path = self._get_file_path(agent_id)
            
            # Prepare content structure
            content_data = {
                "agent_id": agent_id,
                "base_url": scraped_content.get("url", ""),
                "scraped_at": datetime.now().isoformat(),
                "stats": scraped_content.get("stats", {}),
                "pages": scraped_content.get("pages", []),
                "full_content": scraped_content.get("content", ""),  # Combined content
                "metadata": scraped_content.get("metadata", {}),
                "headings": scraped_content.get("headings", [])
            }
            
            # Save to JSON file
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(content_data, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Saved content for agent {agent_id}: {len(content_data['full_content'])} characters")
            return True
            
        except Exception as e:
            print(f"❌ Error saving content: {e}")
            return False
    
    def load_content(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Load scraped content from JSON file"""
        try:
            file_path = self._get_file_path(agent_id)
            
            if not file_path.exists():
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content_data = json.load(f)
            
            return content_data
            
        except Exception as e:
            print(f"❌ Error loading content: {e}")
            return None
    
    def delete_content(self, agent_id: str) -> bool:
        """Delete stored content for an agent"""
        try:
            file_path = self._get_file_path(agent_id)
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception as e:
            print(f"❌ Error deleting content: {e}")
            return False

    def rename_agent(self, old_agent_id: str, new_agent_id: str) -> bool:
        """
        Rename content file from old agent ID to new agent ID.
        Useful when converting temporary agent (from scraping) to permanent one.
        """
        try:
            old_path = self._get_file_path(old_agent_id)
            new_path = self._get_file_path(new_agent_id)
            
            if not old_path.exists():
                print(f"⚠️  Content file for {old_agent_id} not found")
                return False
            
            # If new path exists, delete it first (overwrite)
            if new_path.exists():
                print(f"⚠️  Overwriting existing content for {new_agent_id}")
                new_path.unlink()
            
            # Rename file
            old_path.rename(new_path)
            
            # Update internal JSON data to reflect new agent ID
            try:
                with open(new_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if 'agent_id' in data:
                    data['agent_id'] = new_agent_id
                    
                    with open(new_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
            except Exception as e:
                print(f"⚠️  Failed to update agent_id inside JSON: {e}")
                # Continue anyway as file is renamed
            
            print(f"✅ Renamed content file from {old_agent_id} to {new_agent_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error renaming content: {e}")
            return False
    
    def get_content_chunks(self, agent_id: str, chunk_size: int = 1000) -> List[Dict[str, Any]]:
        """
        Split content into chunks for better retrieval.
        Returns chunks with metadata for semantic search.
        """
        content_data = self.load_content(agent_id)
        if not content_data:
            return []
        
        full_content = content_data.get("full_content", "")
        pages = content_data.get("pages", [])
        
        chunks = []
        
        # If we have individual pages, use them as chunks
        if pages:
            for page in pages:
                # Try to get content from 'content' field first, then fallback to full_content
                page_content = page.get("content", "")
                
                # If no content field, try to get from full_content by matching URL
                if not page_content or len(page_content.strip()) == 0:
                    page_url = page.get("url", "")
                    # For now, use full_content if page content is missing
                    # In future, could match by URL
                    if not page_content:
                        page_content = full_content  # Fallback to full content
                
                if isinstance(page_content, str) and len(page_content.strip()) > 0:
                    # Split large pages into smaller chunks
                    if len(page_content) > chunk_size:
                        words = page_content.split()
                        current_chunk = []
                        current_length = 0
                        
                        for word in words:
                            if current_length + len(word) > chunk_size and current_chunk:
                                chunks.append({
                                    "text": " ".join(current_chunk),
                                    "url": page.get("url", ""),
                                    "title": page.get("title", ""),
                                    "chunk_index": len(chunks)
                                })
                                current_chunk = [word]
                                current_length = len(word)
                            else:
                                current_chunk.append(word)
                                current_length += len(word) + 1
                        
                        # Add remaining chunk
                        if current_chunk:
                            chunks.append({
                                "text": " ".join(current_chunk),
                                "url": page.get("url", ""),
                                "title": page.get("title", ""),
                                "chunk_index": len(chunks)
                            })
                    else:
                        chunks.append({
                            "text": page_content,
                            "url": page.get("url", ""),
                            "title": page.get("title", ""),
                            "chunk_index": len(chunks)
                        })
        else:
            # Fallback: split full content into chunks
            words = full_content.split()
            current_chunk = []
            current_length = 0
            
            for word in words:
                if current_length + len(word) > chunk_size and current_chunk:
                    chunks.append({
                        "text": " ".join(current_chunk),
                        "url": content_data.get("base_url", ""),
                        "title": content_data.get("metadata", {}).get("og_title", ""),
                        "chunk_index": len(chunks)
                    })
                    current_chunk = [word]
                    current_length = len(word)
                else:
                    current_chunk.append(word)
                    current_length += len(word) + 1
            
            # Add remaining chunk
            if current_chunk:
                chunks.append({
                    "text": " ".join(current_chunk),
                    "url": content_data.get("base_url", ""),
                    "title": content_data.get("metadata", {}).get("og_title", ""),
                    "chunk_index": len(chunks)
                })
        
        return chunks
