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
            "role": "- Primary Function: You are an AI assistant designed to help users with their inquiries, issues and requests. You aim to provide excellent, friendly and efficient replies at all times. You should listen attentively to the user, understand their needs, and do your best to assist them or direct them to the appropriate resources. Make sure to end your replies with a positive note.",
            "constraint_2": "Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role. Politely redirect the conversation back to topics covered by the training data.",
            "constraint_4": "Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role or the training data."
        },
        "support": {
            "role": "- Primary Function: You are an AI agent who helps users with their inquiries, issues and requests. You aim to provide excellent, friendly and efficient replies at all times. Your role is to listen attentively to the user, understand their needs, and do your best to assist them or direct them to the appropriate resources. If a question is not clear, ask clarifying questions. Make sure to end your replies with a positive note.",
            "constraint_2": "Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to the training data.",
            "constraint_4": "Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role and training data."
        },
        "sales": {
            "role": "- Primary Function: You are an AI sales assistant focused on helping users explore products and services based on the provided data. Your role is to provide professional guidance, product information, and answer questions to help users make informed decisions. Aim to be proactive and helpful while maintaining a professional tone. End with a positive note.",
            "constraint_2": "Maintaining Focus: If a user attempts to divert you, politely redirect back to products and services available in our data.",
            "constraint_4": "Restrictive Role Focus: You do not perform tasks unrelated to sales (e.g., coding or personal advice)."
        }
    }

    # Used when we have retrieved chunks to ground the answer in
    BASE_PROMPT = """### Business Context
{business_context}

### Role
{role_content}

### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. {constraint_2}
3. Grounded Answers: Prefer the training data snippets below when answering. If the data partially covers the question, use it and supplement with your general knowledge about the business.
4. {constraint_4}

### Relevant Training Data:
{context}
"""

    # Used when no relevant chunks were retrieved
    FALLBACK_PROMPT = """### Business Context
{business_context}

### Role
{role_content}

### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly.
2. {constraint_2}
3. Helpful by Default: Answer using the Business Context above and your general knowledge. If you cannot fully answer, provide the most helpful partial answer you can and direct the user to the official website for more details.
4. {constraint_4}

(No specific training data snippets matched this question — use business context and general knowledge.)
"""

    def __init__(self, llm_agent, company_name: str = "the company", base_info: str = "", persona_type: str = "general"):
        self.llm_agent = llm_agent
        self.company_name = self._sanitize_text(company_name, fallback="the company")
        # Ensure base_info is sanitized but keep it if it's a real summary
        self.base_info = self._sanitize_text(base_info) if base_info else ""
        self.persona_type = persona_type if persona_type in self.PERSONA_TEMPLATES else "general"

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

    def synthesize(self, query: str, chunks: List[Dict], max_chars: int = 3500, intent: str = "general", persona_type: Optional[str] = None) -> Dict:
        """
        Generate a high-quality, assistant-like answer.
        Uses grounded mode when chunks are available, fallback mode otherwise.
        """
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

        # Choose prompt mode: grounded (chunks found) vs fallback (no chunks)
        has_context = bool(context_str.strip())
        if has_context:
            system_prompt = self.BASE_PROMPT.format(
                business_context=business_context,
                role_content=tpl["role"],
                constraint_2=tpl["constraint_2"],
                constraint_4=tpl["constraint_4"],
                context=context_str
            )
        else:
            system_prompt = self.FALLBACK_PROMPT.format(
                business_context=business_context,
                role_content=tpl["role"],
                constraint_2=tpl["constraint_2"],
                constraint_4=tpl["constraint_4"]
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
        
        # Return the full prompt structure as it would appear to the LLM
        full_prompt = self.BASE_PROMPT.format(
            business_context=business_context,
            role_content=tpl["role"],
            constraint_2=tpl["constraint_2"],
            constraint_4=tpl["constraint_4"],
            context="" # Leave empty for clean preview
        ).strip()
        return f"{full_prompt}\n\n(Note: Relevant training data snippets will be automatically injected here during chat based on the user's question.)"

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
        summary = self.llm_agent.chat("System Context: Professional Business Summarizer", summary_prompt.format(content=snippet), max_tokens=150)
        
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
