import re
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class SynthesisAgent:
    """
    Handles final answer generation with a grounded, Chatbase-style persona.
    """
    
    PERSONA_TEMPLATES = {
        "general": {
            "role": "- Primary Function: You are a helpful and professional AI assistant. You provide clear, direct, and concise answers based on the provided context. Avoid overly formal or defensive language like 'The documentation does not mention...'. Instead, provide the most helpful answer possible based on what is known about the business.",
            "constraint_2": "Conversational Tone: Be friendly and professional. Avoid being robotic. If the information is not explicitly found, use reasonable deduction from the business context to provide a helpful answer.",
            "constraint_4": "Helpfulness Priority: Your goal is to help the user. If they ask about basic platform features (like signup or login) and no fees are mentioned, you can confidently state they are free unless the context suggests otherwise."
        },
        "support": {
            "role": "- Primary Function: You are a dedicated support agent. You help users solve problems and find information quickly. Be empathetic, patient, and extremely clear in your instructions.",
            "constraint_2": "Problem Solving: Focus on resolving the user's issue. If you don't have a direct answer, provide a workaround or the most relevant next step.",
            "constraint_4": "Contextual Awareness: Use the training data to provide specific answers. If the data is missing details, guide the user to where they can find them (e.g., 'Check the settings page')."
        },
        "sales": {
            "role": "- Primary Function: You are a proactive sales assistant. Your goal is to highlight the value of products and services. Be persuasive, professional, and focus on benefits.",
            "constraint_2": "Value Focus: Highlight why the user should choose this business. Use the training data to back up your claims with specific details.",
            "constraint_4": "Direct Guidance: If a user asks about pricing or features, give a clear and positive answer. If pricing is tiered, explain the value of the higher tiers."
        }
    }

    # Used when we have retrieved chunks to ground the answer in
    BASE_PROMPT = """### Business Context
{business_context}

### AI Character
{role_content}

### Operating Guidelines
1. Professional Identity: Never mention you are an AI using 'training data' or 'context snippets'. Just answer as the business assistant.
2. {constraint_2}
3. Smart Deducing: If the training data doesn't explicitly answer but the Business Context or industry norms do (e.g., 'signup is free'), provide a confident answer. Avoid saying 'I don't find this information'.
4. {constraint_4}

### Conversation History:
{history_str}

### Knowledge Base Snippets:
{context}
"""

    # Used when no relevant chunks were retrieved
    FALLBACK_PROMPT = """### Business Context
{business_context}

### AI Character
{role_content}

### Operating Guidelines
1. Identity: Be a representative of this business. Never technical.
2. {constraint_2}
3. Direct Answers: Answer using the Business Context and your general knowledge about this industry. If the user asks about basic operations (how to login, fees for signup), and you see no charges in context, assume it's free and be helpful.
4. {constraint_4}

### Conversation History:
{history_str}

(No specific training data snippets matched this question — use business context and general knowledge to be as helpful as possible.)
"""

    def __init__(self, llm_agent, company_name: str = "the company", base_info: str = "", persona_type: str = "general"):
        self.llm_agent = llm_agent
        self.company_name = company_name
        self.base_info = base_info
        self.persona_type = persona_type

    def _sanitize_text(self, text: str, fallback: str = "") -> str:
        """Filter out technical identifiers, base64 data, and garbled strings."""
        if not text or not isinstance(text, str):
            return fallback
        
        # Check for technical markers
        if "temp_" in text or "aHR0" in text or "agent_" in text or "bool_" in text:
            # If it's a long context, maybe it just contains a link, but if the whole string is short and has these, junk it
            if len(text) < 100:
                return fallback
        
        # If it looks like a single long random token (Base64/Hash)
        if len(text) > 25 and " " not in text.strip():
            return fallback
            
        return text.strip()

    def set_persona(self, persona_type: str):
        """Update the default persona type for this agent instance."""
        if persona_type in self.PERSONA_TEMPLATES:
            self.persona_type = persona_type
            logger.info(f"🎭 Switched persona to: {persona_type}")

    def synthesize(
        self, 
        query: str, 
        chunks: List[Dict], 
        max_chars: int = 2000, 
        intent: str = "general",
        persona_type: Optional[str] = None,
        history: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate a high-quality, assistant-like answer.
        Uses grounded mode when chunks are available, fallback mode otherwise.
        """
        if not chunks and not self.base_info:
            return self._refusal_response()

        if not chunks:
            chunks = []

        # Determine persona for this specific request
        active_persona = persona_type if persona_type and persona_type in self.PERSONA_TEMPLATES else self.persona_type
        tpl = self.PERSONA_TEMPLATES.get(active_persona, self.PERSONA_TEMPLATES["general"])

        # Build clean context string from retrieved chunks
        context_parts = []
        sources = []
        for i, chunk in enumerate(chunks[:8]):
            text = chunk.get('answer') if chunk.get('is_qa') else chunk.get('text', '')
            if not text: text = chunk.get('text', '')
            
            url = chunk.get('url', 'Internal Knowledge')
            title = chunk.get('title', 'Knowledge base')
            
            context_parts.append(f"Document {i+1} ({title}):\n{text}\nSource URL: {url}\n")
            sources.append({
                'url': url,
                'title': title,
                'relevance': chunk.get('similarity_score', 0) or chunk.get('rerank_score', 0)
            })

        context_str = "\n---\n".join(context_parts)[:max_chars]
        
        # Determine business context
        business_context = self.base_info if self.base_info else f"This is an AI assistant for {self.company_name}."

        # Format history (last 4 messages for context)
        history_str = "No previous history."
        if history and len(history) > 0:
            formatted_history = []
            for msg in history[-4:]:
                role = "User" if msg.get("role") == "user" else "Assistant"
                content = msg.get("content", "")
                formatted_history.append(f"{role}: {content}")
            history_str = "\n".join(formatted_history)

        # Choose prompt mode: grounded (chunks found) vs fallback (no chunks)
        has_context = bool(context_str.strip())
        if has_context:
            system_prompt = self._safe_format(
                self.BASE_PROMPT,
                business_context=business_context,
                role_content=tpl["role"],
                constraint_2=tpl["constraint_2"],
                constraint_4=tpl["constraint_4"],
                history_str=history_str,
                context=context_str
            )
        else:
            system_prompt = self._safe_format(
                self.FALLBACK_PROMPT,
                business_context=business_context,
                role_content=tpl["role"],
                constraint_2=tpl["constraint_2"],
                constraint_4=tpl["constraint_4"],
                history_str=history_str
            )
        
        # Low temperature (0.1) for high precision and groundedness
        user_prompt = f"User Question: {query}\nDetected Intent: {intent}"
        answer = self.llm_agent.chat(system_prompt, user_prompt, temperature=0.1)
        
        if not answer:
            return self._refusal_response()

        # Cleanup answer (remove "Based on context..." etc)
        answer = re.sub(r'^(Based on the context|According to the knowledge base|Answer):\s*', '', answer, flags=re.IGNORECASE)

        confidence = 0
        if chunks:
            confidence = 95 if chunks[0].get('is_qa') else 85
        else:
            confidence = 50  # Lower confidence when using general knowledge fallback

        return {
            'answer': answer.strip(),
            'confidence': confidence,
            'sources': self._deduplicate_sources(sources),
            'intent': 'content_based' if has_context else 'general'
        }

    def get_persona_prompt(self, persona_type: Optional[str] = None) -> str:
        """Get the full instructions for a specific persona (for UI display)."""
        active_persona = persona_type if persona_type and persona_type in self.PERSONA_TEMPLATES else self.persona_type
        tpl = self.PERSONA_TEMPLATES.get(active_persona, self.PERSONA_TEMPLATES["general"])
        
        business_context = self.base_info if self.base_info else f"[Company Name]: [Short Description]. [Key Services/Categories]. [Value Prop]."
        
        # Safe formatting using replace to avoid KeyError ghosting
        full_prompt = self._safe_format(
            self.BASE_PROMPT,
            business_context=business_context,
            role_content=tpl["role"],
            constraint_2=tpl["constraint_2"],
            constraint_4=tpl["constraint_4"],
            history_str="[Conversation history will be injected here during chat]",
            context="" # Leave empty for clean preview
        ).strip()
        return f"{full_prompt}\n\n(Note: Relevant training data snippets will be automatically injected here during chat based on the user's question.)"

    def _safe_format(self, template: str, **kwargs) -> str:
        """Robust formatting using replacement to prevent KeyError in production environments."""
        result = template
        for key, value in kwargs.items():
            result = result.replace("{" + key + "}", str(value))
        return result

    def extract_business_context(self, content: str) -> str:
        """
        Extract a professional business summary from scraped content.
        This provides the dynamic 'Business Context' for the agent.
        """
        if not content or len(content.strip()) < 100:
            return f"This is an AI assistant for {self.company_name}."

        summary_prompt = """### Role
- Primary Function: You are a **Business Intelligence Analyst**.
- Task: Summarize the provided website content into a concise, professional "Business Context" for an AI chatbot.

### Requirements:
1. Identify the Company Name.
2. List 3-4 Main Categories or Services.
3. Mention key unique value propositions (e.g., free shipping, specific industry focus).
4. Keep it under 250 characters.
5. Format: [Company Name]: [Short Description]. [Key Services/Categories]. [Value Prop].

### Website Content:
{content}

### REWRITTEN BUSINESS CONTEXT:
"""
        # Use a short window of the total content for speed and relevance
        snippet = content[:5000]
        formatted_summary_prompt = self._safe_format(summary_prompt, content=snippet)
        summary = self.llm_agent.chat("System Context: Professional Business Summarizer", formatted_summary_prompt, max_tokens=150)
        
        if summary:
            # Ensure the extracted summary doesn't contain the very IDs we're trying to hide
            sanitized = self._sanitize_text(summary, fallback=f"This is an AI assistant for {self.company_name}.")
            return sanitized
        return f"{self.company_name} is a professional organization specialized in their field."

    def _refusal_response(self) -> Dict:
        return {
            'answer': "I don't have that information in my knowledge base.",
            'confidence': 0,
            'sources': [],
            'intent': 'no_match'
        }

    def _extract_clean_answer(self, text: str) -> str:
        """Remove Question/Answer prefixes and return cleaned sentences."""
        # Remove 'Question: ... Answer: ' prefixes
        text = re.sub(r'^(Question|Answer):\s*', '', text, flags=re.IGNORECASE)
        # Attempt to split on "Answer:" specifically if it's a combined FAQ chunk
        if "Answer:" in text:
            text = text.split("Answer:", 1)[1].strip()
            
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return " ".join(sentences[:2]).strip()

    def _deduplicate_sources(self, sources: List[Dict]) -> List[Dict]:
        seen = set()
        unique = []
        for s in sources:
            if s['url'] not in seen:
                unique.append(s)
                seen.add(s['url'])
        return unique
