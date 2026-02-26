from typing import List, Dict, Optional
import requests
import os

class LLMAgent:
    """
    Uses an LLM (local Ollama or cloud providers like xAI/Groq) to generate or refine answers.
    """
    
    def __init__(
        self, 
        model_name: str = "llama3", 
        provider: str = "ollama",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        """
        Initialize the LLM agent.
        
        Args:
            model_name: Name of the model to use
            provider: 'ollama', 'xai', or 'groq'
            api_key: API key for cloud providers
            base_url: Base URL for the API (if different from default)
        """
        self.provider = provider.lower()
        self.model_name = model_name
        self.api_key = api_key
        
        if self.provider == "ollama":
            self.base_url = base_url or os.getenv("OLLAMA_URL", "http://localhost:11434")
            self.chat_url = f"{self.base_url}/api/chat"
        elif self.provider == "xai":
            self.base_url = base_url or "https://api.x.ai/v1"
            self.chat_url = f"{self.base_url}/chat/completions"
        elif self.provider == "groq":
            self.base_url = base_url or "https://api.groq.com/openai/v1"
            self.chat_url = f"{self.base_url}/chat/completions"
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")
            
        self.available = self._check_provider_available()
    
    def _check_provider_available(self) -> bool:
        """Check if the selected provider and model are available."""
        if self.provider == "ollama":
            try:
                response = requests.get(f"{self.base_url}/api/tags", timeout=2)
                if response.status_code == 200:
                    models = response.json().get('models', [])
                    model_names = [model.get('name', '') for model in models]
                    if any(self.model_name in name for name in model_names):
                        print(f"[OK] Ollama is available with model: {self.model_name}")
                        return True
                    else:
                        print(f"[WARN] Ollama is running but model '{self.model_name}' not found.")
                        return False
            except Exception:
                return False
        elif self.provider in ["xai", "groq"]:
            if not self.api_key:
                print(f"[WARN] {self.provider.upper()} API key missing. Set appropriate key in .env")
                return False
            print(f"[INFO] Using Cloud LLM ({self.provider.upper()}) with model: {self.model_name}")
            return True
        return False
    
    def _call_llm(self, messages: List[Dict], options: Dict = None) -> Optional[str]:
        """Generic method to call the LLM API based on provider."""
        if not self.available:
            return None
            
        try:
            headers = {}
            if self.provider in ["xai", "groq"]:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
            
            payload = {
                "model": self.model_name,
                "messages": messages,
                "stream": False
            }
            
            # Map options to provider-specific formats
            if options:
                if self.provider == "ollama":
                    payload["options"] = options
                elif self.provider in ["xai", "groq"]:
                    # OpenAI style uses flat options
                    payload.update(options)
            
            response = requests.post(
                self.chat_url,
                json=payload,
                headers=headers,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                if self.provider == "ollama":
                    return result.get('message', {}).get('content', '').strip()
                elif self.provider in ["xai", "groq"]:
                    return result.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
            else:
                print(f"Error calling {self.provider} ({response.status_code}): {response.text}")
                return None
                
        except Exception as e:
            print(f"Exception during LLM call to {self.provider}: {e}")
            return None

    def generate_answer(
        self, 
        user_query: str, 
        top_qa_pairs: List[Dict], 
        context: Optional[str] = None
    ) -> str:
        """
        Generate an answer using the LLM when semantic search confidence is low.
        """
        # Build context string from top Q&A pairs
        qa_context = ""
        if top_qa_pairs:
            qa_context = "Relevant Q&A pairs from knowledge base:\n"
            for i, qa in enumerate(top_qa_pairs[:5], 1):
                qa_context += f"{i}. Q: {qa.get('question', '')}\n   A: {qa.get('answer', '')}\n"

        # Build additional context string
        context_str = f"\nAdditional Context:\n{context}\n" if context else ""

        # System message for rules
        system_rules = f"You are a helpful chat assistant. Answer the user's question using ONLY the information provided.\n\n{qa_context}{context_str}\n\n"
        system_rules += "🚫 CRITICAL RULES:\n1. Answer ONLY using the information provided above.\n2. If the answer is not in the provided information, say: \"I don't have information about that. Could you ask about something else?\"\n3. NEVER use your general knowledge to \"expand\" on details.\n4. NEVER make up company names, products, or features.\n5. Provide a direct answer. Avoid introductory phrases or conversational filler."

        messages = [
            {"role": "system", "content": system_rules},
            {"role": "user", "content": user_query}
        ]

        answer = self._call_llm(messages, options={"temperature": 0.3, "max_tokens": 150})
        
        if answer:
            # Clean up prefixes
            prefixes_to_remove = ["Answer:", "Based on the Q&A pairs:", "According to the knowledge base:"]
            for prefix in prefixes_to_remove:
                if answer.startswith(prefix):
                    answer = answer[len(prefix):].strip()
            return answer
            
        # Fallback
        if top_qa_pairs:
            return top_qa_pairs[0].get('answer', "I'm not sure how to answer that.")
        return "I'm not sure how to answer that. Could you provide more details?"

    def refine_answer(
        self, 
        user_query: str, 
        matched_answer: str,
        confidence: float
    ) -> str:
        """
        Refine an existing answer using LLM when confidence is medium (70-85%).
        """
        messages = [
            {"role": "system", "content": "You're a friendly chat assistant. Make the provided answer more natural and conversational. 🚫 CRITICAL: Keep the SAME information - don't add anything new. Just 1-2 sentences."},
            {"role": "user", "content": f"User asked: \"{user_query}\"\n\nCurrent answer:\n{matched_answer}"}
        ]

        refined = self._call_llm(messages, options={"temperature": 0.4, "max_tokens": 100})
        
        if refined:
            prefixes_to_remove = ["Refined Answer:", "Answer:"]
            for prefix in prefixes_to_remove:
                if refined.startswith(prefix):
                    refined = refined[len(prefix):].strip()
            return refined
            
        return matched_answer

    def generate_answer_from_content(
        self,
        user_query: str,
        context: str
    ) -> str:
        """
        Generate an answer from scraped website content (RAG approach).
        """
        # Strip system tags if they were manually injected by the caller
        clean_context = context
        if "<|begin_of_text|>" in context:
            if "<|start_header_id|>user<|end_header_id|>" in context:
                clean_context = context.split("<|start_header_id|>user<|end_header_id|>")[-1]
                clean_context = clean_context.split("<|eot_id|>")[0].strip()

        system_msg = (
            "You are a professional assistant. Answer the user's question using the provided context and global knowledge.\n\n"
            "🚫 CRITICAL INSTRUCTION:\n"
            "1. If content is marked with [AUTHORITATIVE KNOWLEDGE] or [GLOBAL KNOWLEDGE], it is the TRUTH. Use it to answer identity questions.\n"
            "2. Answer in 1–3 clear sentences. Keep it direct and professional.\n"
            "3. If the answer is not in the context or global knowledge, say: 'I don't have information about that in my knowledge base.'\n"
            "4. Avoid using external knowledge not related to the company's identity."
        )

        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": f"CONTEXT:\n{clean_context}\n\nQUESTION: {user_query}\n\nGive a brief, direct answer (1–3 sentences):"}
        ]

        answer = self._call_llm(messages, options={"temperature": 0.2, "max_tokens": 200})
        
        if answer:
            prefixes_to_remove = ["Answer:", "Based on the context:", "According to the website:", "ANSWER (based ONLY on context above):", "ANSWER:"]
            for prefix in prefixes_to_remove:
                if answer.startswith(prefix):
                    answer = answer[len(prefix):].strip()
            return answer
            
        return None