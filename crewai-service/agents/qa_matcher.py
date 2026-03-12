from typing import List, Dict, Optional
import numpy as np

# Try to import sentence_transformers, but make it optional
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    SentenceTransformer = None

class QAMatcherAgent:
    """
    Finds the best matching Q&A pair for a user query.
    """
    
    def __init__(self):
        # Load sentence transformer for semantic similarity
        self.model = None
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                print(f"Warning: Could not load SentenceTransformer model: {e}")
                print("Falling back to keyword-based matching.")
                self.model = None
    
    def find_match(self, message: str, qa_pairs: List[Dict], intent: str, top_k: int = 5) -> Dict:
        """
        Find the best matching Q&A pair for the user message.
        Also returns top_k matches for LLM context.
        
        Returns:
            {
                'question': str,
                'answer': str,
                'confidence': float,
                'top_matches': List[Dict]  # Top K matches for LLM context
            } or None
        """
        if not qa_pairs:
            return None
        
        # Filter Q&A pairs by intent if available
        relevant_pairs = [
            qa for qa in qa_pairs
            if qa.get('intent') == intent or not qa.get('intent')
        ]
        
        if not relevant_pairs:
            relevant_pairs = qa_pairs
        
        # Store all matches with scores
        matches_with_scores = []
        
        # Use semantic similarity if model is available
        if self.model:
            try:
                # First check for exact matching (very high priority)
                message_normalized = message.lower().strip()
                for qa in relevant_pairs:
                    if not qa.get('question'):
                        continue
                    if qa['question'].lower().strip() == message_normalized:
                        matches_with_scores.append({
                            'qa': qa,
                            'score': 1.0
                        })
                        continue # Skip semantic search for this one if exact match found
                
                # If we don't have enough exact matches, use semantic similarity
                valid_pairs = [qa for qa in relevant_pairs if qa.get('question')]
                questions_to_encode = [qa['question'] for qa in valid_pairs 
                                      if not any(m['qa'] == qa and m['score'] == 1.0 for m in matches_with_scores)]
                
                if questions_to_encode:
                    message_embedding = self.model.encode([message], convert_to_numpy=True)[0]
                    question_embeddings = self.model.encode(questions_to_encode, convert_to_numpy=True)
                    
                    e_idx = 0
                    for qa in valid_pairs:
                        if any(m['qa'] == qa and m['score'] == 1.0 for m in matches_with_scores):
                            continue
                        
                        question_emb = question_embeddings[e_idx]
                        e_idx += 1
                        
                        # Calculate cosine similarity
                        dot_product = np.dot(message_embedding, question_emb)
                        norm_product = np.linalg.norm(message_embedding) * np.linalg.norm(question_emb)
                        
                        similarity = dot_product / norm_product if norm_product > 0 else 0.0
                        
                        matches_with_scores.append({
                            'qa': qa,
                            'score': similarity
                        })
            except Exception as e:
                print(f"Error in semantic matching: {e}")
                import traceback
                print(traceback.format_exc())
                # Fallback to keyword matching
                best_match = self._keyword_match(message, relevant_pairs)
                best_score = 0.8 if best_match else 0
                if best_match:
                    return {
                        'question': best_match['question'],
                        'answer': best_match['answer'],
                        'confidence': float(best_score),
                        'top_matches': [{'question': best_match['question'], 'answer': best_match['answer']}]
                    }
                return None
        else:
            # Fallback to keyword matching
            best_match = self._keyword_match(message, relevant_pairs)
            best_score = 0.8 if best_match else 0
            if best_match:
                return {
                    'question': best_match['question'],
                    'answer': best_match['answer'],
                    'confidence': float(best_score),
                    'top_matches': [{'question': best_match['question'], 'answer': best_match['answer']}]
                }
            return None
        
        # Sort by score (descending)
        matches_with_scores.sort(key=lambda x: x['score'], reverse=True)
        
        # Get best match
        if matches_with_scores and matches_with_scores[0]['score'] > 0.5:
            best_match_data = matches_with_scores[0]
            best_match = best_match_data['qa']
            best_score = best_match_data['score']
            
            # Get top K matches for LLM context
            top_matches = [
                {
                    'question': item['qa'].get('question', ''),
                    'answer': item['qa'].get('answer', '')
                }
                for item in matches_with_scores[:top_k]
            ]
            
            return {
                'question': best_match['question'],
                'answer': best_match['answer'],
                'confidence': float(best_score),
                'top_matches': top_matches
            }
        
        # Even if no high-confidence match, return top matches for LLM
        if matches_with_scores:
            top_matches = [
                {
                    'question': item['qa'].get('question', ''),
                    'answer': item['qa'].get('answer', '')
                }
                for item in matches_with_scores[:top_k]
            ]
            return {
                'question': matches_with_scores[0]['qa'].get('question', ''),
                'answer': matches_with_scores[0]['qa'].get('answer', ''),
                'confidence': float(matches_with_scores[0]['score']),
                'top_matches': top_matches
            }
        
        return None
    
    def _keyword_match(self, message: str, qa_pairs: List[Dict]) -> Optional[Dict]:
        """Simple keyword-based matching fallback."""
        if not message or not qa_pairs:
            return None
            
        message_words = set(message.lower().split())
        if not message_words:
            return None
        
        best_match = None
        best_score = 0
        
        for qa in qa_pairs:
            if not qa.get('question'):
                continue
            question_words = set(qa['question'].lower().split())
            if not question_words:
                continue
                
            common_words = message_words.intersection(question_words)
            
            if len(common_words) > 0:
                score = len(common_words) / max(len(message_words), len(question_words))
                if score > best_score:
                    best_score = score
                    best_match = qa
        
        return best_match
