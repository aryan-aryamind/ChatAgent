from typing import List, Dict, Optional
import requests
import os

class LLMAgent:
    """
    Uses a local LLM (Ollama) to generate or refine answers when semantic search confidence is low.
    """
    
    def __init__(self, model_name: str = "phi3:mini", ollama_url: str = "http://localhost:11434"):
        """
        Initialize the LLM agent.
        
        Args:
            model_name: Name of the Ollama model to use (default: phi3:mini - 3.8B, ~2GB)
            ollama_url: URL of the Ollama server (default: http://localhost:11434)
        """
        self.model_name = model_name
        self.ollama_url = ollama_url
        self.available = self._check_ollama_available()
    
    def _check_ollama_available(self) -> bool:
        """Check if Ollama is running and the model is available."""
        try:
            # Check if Ollama is running
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=2)
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [model.get('name', '') for model in models]
                if any(self.model_name in name for name in model_names):
                    print(f"✅ Ollama is available with model: {self.model_name}")
                    return True
                else:
                    print(f"⚠️  Ollama is running but model '{self.model_name}' not found.")
                    print(f"   Available models: {[m.get('name') for m in models]}")
                    print(f"   Run: ollama pull {self.model_name}")
                    return False
        except requests.exceptions.RequestException as e:
            print(f"⚠️  Ollama not available at {self.ollama_url}: {e}")
            print(f"   Install Ollama from https://ollama.ai and run: ollama pull {self.model_name}")
            return False
        return False
    
    def generate_answer(
        self, 
        user_query: str, 
        top_qa_pairs: List[Dict], 
        context: Optional[str] = None
    ) -> str:
        """
        Generate an answer using the LLM when semantic search confidence is low.
        
        Args:
            user_query: The user's question
            top_qa_pairs: Top 3-5 similar Q&A pairs from semantic search (even if low confidence)
            context: Additional context (optional)
        
        Returns:
            Generated answer string
        """
        if not self.available:
            # Fallback to best Q&A pair if LLM is not available
            if top_qa_pairs:
                return top_qa_pairs[0].get('answer', "I'm not sure how to answer that. Could you provide more details?")
            return "I'm not sure how to answer that. Could you provide more details?"
        
        try:
            # Build context from top Q&A pairs
            qa_context = ""
            if top_qa_pairs:
                qa_context = "\n\nRelevant Q&A pairs from knowledge base:\n"
                for i, qa in enumerate(top_qa_pairs[:5], 1):  # Top 5 pairs
                    qa_context += f"{i}. Q: {qa.get('question', '')}\n   A: {qa.get('answer', '')}\n"
            
            # Build the prompt
            prompt = f"""Answer the user's question briefly and accurately using the Q&A pairs below.

{qa_context}

User Question: {user_query}

Instructions:
- Answer in 1-2 short sentences maximum
- Use only information from the Q&A pairs
- Be direct and to the point
- No explanations or extra details

Answer:"""

            # Call Ollama API
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.5,  # Lower temperature for more focused answers
                        "top_p": 0.9,
                        "max_tokens": 150,  # Shorter responses
                    }
                },
                timeout=30  # 30 second timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                answer = result.get('response', '').strip()
                
                # Clean up the answer (remove any prompt artifacts)
                if answer:
                    # Remove common prefixes that models sometimes add
                    prefixes_to_remove = [
                        "Answer:",
                        "Based on the Q&A pairs:",
                        "According to the knowledge base:",
                    ]
                    for prefix in prefixes_to_remove:
                        if answer.startswith(prefix):
                            answer = answer[len(prefix):].strip()
                    
                    return answer
                else:
                    # Fallback if LLM returns empty
                    if top_qa_pairs:
                        return top_qa_pairs[0].get('answer', "I'm not sure how to answer that.")
                    return "I'm not sure how to answer that. Could you provide more details?"
            else:
                print(f"Error calling Ollama: {response.status_code} - {response.text}")
                # Fallback to best Q&A pair
                if top_qa_pairs:
                    return top_qa_pairs[0].get('answer', "I'm not sure how to answer that.")
                return "I'm not sure how to answer that. Could you provide more details?"
                
        except requests.exceptions.Timeout:
            print("⚠️  Ollama request timed out. Using fallback answer.")
            if top_qa_pairs:
                return top_qa_pairs[0].get('answer', "I'm not sure how to answer that.")
            return "I'm not sure how to answer that. Could you provide more details?"
        except Exception as e:
            print(f"Error in LLM generation: {e}")
            import traceback
            print(traceback.format_exc())
            # Fallback to best Q&A pair
            if top_qa_pairs:
                return top_qa_pairs[0].get('answer', "I'm not sure how to answer that.")
            return "I'm not sure how to answer that. Could you provide more details."
    
    def refine_answer(
        self, 
        user_query: str, 
        matched_answer: str,
        confidence: float
    ) -> str:
        """
        Refine an existing answer using LLM when confidence is medium (70-85%).
        
        Args:
            user_query: The user's question
            matched_answer: The answer from semantic search
            confidence: Confidence score from semantic search
        
        Returns:
            Refined answer string
        """
        if not self.available:
            return matched_answer  # Return original if LLM not available
        
        try:
            prompt = f"""Make this answer shorter and more direct.

User Question: {user_query}

Current Answer:
{matched_answer}

Instructions:
- Keep it to 1-2 short sentences
- Remove unnecessary words
- Be direct and to the point

Refined Answer:"""

            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.4,  # Lower temperature for concise refinement
                        "top_p": 0.9,
                        "max_tokens": 100,  # Shorter refined responses
                    }
                },
                timeout=20
            )
            
            if response.status_code == 200:
                result = response.json()
                refined = result.get('response', '').strip()
                
                if refined:
                    # Remove prompt artifacts
                    prefixes_to_remove = ["Refined Answer:", "Answer:"]
                    for prefix in prefixes_to_remove:
                        if refined.startswith(prefix):
                            refined = refined[len(prefix):].strip()
                    return refined
            
            # Fallback to original answer
            return matched_answer
            
        except Exception as e:
            print(f"Error in LLM refinement: {e}")
            return matched_answer  # Return original answer on error
    
    def generate_answer_from_content(
        self,
        user_query: str,
        context: str
    ) -> str:
        """
        Generate an answer from scraped website content (RAG approach).
        
        Args:
            user_query: The user's question
            context: Relevant content chunks from the website OR full prompt
        
        Returns:
            Generated answer string
        """
        if not self.available:
            # Fallback: return first part of context
            return context.split('\n')[0][:200] + "..."
        
        try:
            # Check if context is already a full prompt (contains "CRITICAL RULES" or "CONTEXT FROM WEBSITE")
            # If so, use it directly; otherwise, build prompt
            if "CRITICAL RULES" in context or "CONTEXT FROM WEBSITE" in context:
                # Already a full prompt, use directly
                prompt = context
            else:
                # Build prompt from context
                prompt = f"""Answer the user's question using ONLY the information provided in the context below.
If the context doesn't contain enough information to answer, say so.

Context from website:
{context}

User Question: {user_query}

Instructions:
- Answer based ONLY on the context provided
- Be concise (2-3 sentences maximum)
- If you can't answer from the context, say "I don't have enough information to answer that question."
- Be direct and helpful

Answer:"""

            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_tokens": 200,
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                answer = result.get('response', '').strip()
                
                # Clean up the answer
                if answer:
                    prefixes_to_remove = [
                        "Answer:", "Based on the context:", "According to the website:",
                        "ANSWER (based ONLY on context above):", "ANSWER:"
                    ]
                    for prefix in prefixes_to_remove:
                        if answer.startswith(prefix):
                            answer = answer[len(prefix):].strip()
                    return answer
                else:
                    return context.split('\n')[0][:200] + "..."
            else:
                print(f"Error calling Ollama: {response.status_code}")
                return context.split('\n')[0][:200] + "..."
                
        except Exception as e:
            print(f"Error in LLM content generation: {e}")
            # Fallback: return relevant context
            return context.split('\n')[0][:200] + "..."