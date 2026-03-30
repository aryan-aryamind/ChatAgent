import re
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class SynthesisAgent:
    """
    Handles final answer generation with a grounded, Chatbase-style persona.
    """
    
    ENFORCED_RULES = """
MANDATORY FORMATTING & GROUNDING RULES
1. No Hallucinations: NEVER provide specific prices, discounts, features, or technical specs unless they are EXPLICITLY stated in the "Knowledge Base Snippets" or "Business Context". 
2. Product-Price Matching: ONLY provide a price if it is explicitly linked to the specific product in the same snippet. NEVER assume a price belongs to a similar product.
3. No Data Guessing: If a user asks for a price/spec that is NOT in the context, politely state that you "don't have the exact pricing information/details for that specific product at the moment."
4. Situational Links: ONLY include a link if it is directly relevant to the user's request, if the user explicitly asks for a link, or for a specific product reference. NEVER send the same link in every message if it is not requested. Use `[Label](URL)` format.
5. No Meta-Commentary: NEVER mention "snippets", "training data", or "knowledge base". Speak naturally as the company representative.
6. Categorization: When multiple products or categories are found, organize them using clear headings or bullet points.
7. Brand Identity: Use the company name from the Business Context.
8. BALANCED RESPONSE: 
   - DEFAULT: Provide a comprehensive but concise answer (3-4 sentences). Don't wait for follow-up questions if the information is already in the context.
   - ELABORATION: Maximum 6-8 sentences when the user asks for more details.
   - Skip introductory fluff.
"""

    PERSONA_TEMPLATES = {
        "general": {
            "role": """Role
- Primary Function: You are an AI agent who helps users with their inquiries, issues and requests.
- Objective: Provide short, simple, and helpful answers. Organise information clearly.
- Tone: Professional, friendly, and concise. 

Constraints
1. Brevity: Keep replies to 2-3 lines by default (max 5). 
2. Proactive: If needed, ask a single short follow-up question.
3. No Meta-Commentary: Never mention "snippets" or "data access".
4. Formatting: Use links sparingly and only when directly relevant or requested. Use `[Descriptive Label](URL)`.
"""
        },
        "support": {
            "role": """Role
- Primary Function: You are a customer support agent. Help users with specific answers from the training data.
- Objective: Provide accurate solutions while maintaining an empathetic and professional tone.
- Tone: Empathetic, clear, and professional. 

Constraints
1. Solutions: Provide direct, easy-to-follow steps or specific contact details (phone, email) found in the context.
2. Proactive: Ask if the user needs help with anything else or if the provided solution resolved their issue.
3. No Meta-Commentary: Never mention "snippets".
4. Positive Closing: Reassure the user and end on a positive note.
5. Formatting: Use `[Descriptive Label](URL)` for all links."""
        },
        "sales": {
            "role": """Role
- Primary Function: You are a sales assistant helping potential customers with product/service details.
- Objective: Highlight specific product features, prices, and benefits to assist the customer's purchase decision.
- Tone: Persuasive, informative, and engaging. 

Constraints
1. Comparison: If multiple products fit the query, compare them briefly based on features/price found in the context.
2. Proactive: Ask about the user's budget or specific requirements to recommend the best option.
3. No Meta-Commentary: Never mention "training data".
4. Positive Closing: Encourage the next step (e.g. "Would you like me to help you find the purchase link?") and end positively.
5. Formatting: Use `[Descriptive Label](URL)` for all links."""
        }
    }

    # Combined base prompt structure
    BASE_PROMPT = """Business Context
{business_context}

{persona_content}

Conversation History:
{history_str}

Knowledge Base Snippets:
{context}
"""

    # Used when no relevant chunks were retrieved
    FALLBACK_PROMPT = """Business Context
{business_context}

{persona_content}

Conversation History:
{history_str}

IMPORTANT:
No specific matches were found in the training data for this query. 
- You MUST NOT guess prices, features, or technical details.
- Provide a short (2-3 lines) helpful response or ask for more details.
- If they ask for a price you don't have, apologize shortly and state you don't have that specific pricing information yet.
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
        history: List[Dict] = None,
        system_prompt: Optional[str] = None,
        company_name: Optional[str] = None
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
        active_company_name = company_name or self.company_name
        business_context = self.base_info if self.base_info else f"This is an AI assistant for {active_company_name}."

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
        
        # If a custom system prompt is provided from the UI, prioritize it
        if system_prompt:
            logger.info("🛠️ Using custom system prompt from UI")
            # Ensure custom prompt STILL has history and context if it's missing them
            # (Users might delete the placeholders by accident in the UI)
            if "{history_str}" not in system_prompt:
                system_prompt += "\n\n### Conversation History:\n{history_str}"
            if has_context and "{context}" not in system_prompt:
                system_prompt += "\n\n### Knowledge Base Snippets:\n{context}"
                
            final_system_prompt = self._safe_format(
                system_prompt,
                business_context=business_context,
                persona_content=tpl["role"],
                history_str=history_str,
                context=context_str
            )
            # FORCE backend rules even on custom UI prompts
            final_system_prompt += "\n\n" + self.ENFORCED_RULES
        elif has_context:
            final_system_prompt = self._safe_format(
                self.BASE_PROMPT,
                business_context=business_context,
                persona_content=tpl["role"],
                history_str=history_str,
                context=context_str
            )
        else:
            final_system_prompt = self._safe_format(
                self.FALLBACK_PROMPT,
                business_context=business_context,
                persona_content=tpl["role"],
                history_str=history_str
            )
        
        print(f"DEBUG: Final System Prompt Length: {len(final_system_prompt)}")
        print(f"DEBUG: Enforced Rules at end: {final_system_prompt[-200:]}")
        
        # Low temperature (0.1) for high precision and groundedness
        user_prompt = f"User Question: {query}"
        answer = self.llm_agent.chat(final_system_prompt, user_prompt, temperature=0.1)
        
        answer_str = answer or ""
        print(f"DEBUG: Raw Answer Length: {len(answer_str)}")
        print(f"DEBUG: Raw Answer Lines: {len(answer_str.splitlines())}")
        
        logger.info(f"🤖 RAW LLM ANSWER: {answer}")
        
        if not answer:
            return self._refusal_response()

        # Cleanup answer (remove "Based on context..." etc)
        meta_phrases = [
            r'^(Based on the (?:context|provided|snippets|knowledge base|information))' ,
            r'^(According to the (?:context|provided|snippets|knowledge base|information))',
            r'^(Unfortunately, (?:the provided snippets|the information available))',
            r'^(Answer:)',
            r'^(The provided snippets (?:do not|don\'t) include)'
        ]
        for phrase in meta_phrases:
            answer = re.sub(phrase + r'[:,\s]*', '', answer, flags=re.IGNORECASE)

        # Force a trim based on request type (sentence count is more reliable than line count)
        is_elaboration_request = any(word in query.lower() for word in ["elaborate", "detail", "more info", "explain more", "why", "how", "claborate"])
        
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', answer_str) if s.strip()]
        max_sentences = 8 if is_elaboration_request else 4
        
        if len(sentences) > max_sentences:
            print(f"DEBUG: Trimming response. Sentences: {len(sentences)}, Limit: {max_sentences}")
            # Try to keep the last sentence if it's a question
            last_sentence = sentences[-1]
            if last_sentence.endswith('?') and len(sentences) > max_sentences:
                answer = " ".join(sentences[:max_sentences-1]) + " " + last_sentence
            else:
                answer = " ".join(sentences[:max_sentences])
            print(f"DEBUG: Trimmed answer: {answer}")

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
        
        # We return the template with placeholders INTACT for the UI to show.
        # This keeps the UI preview "live" and editable.
        return self._safe_format(
            self.BASE_PROMPT,
            business_context=business_context,
            persona_content=tpl["role"],
            history_str="{history_str}",
            context="{context}"
        ).strip()

    def _safe_format(self, template: str, **kwargs) -> str:
        """Robust formatting using replacement to prevent KeyError in production environments."""
        result = template
        for key, value in kwargs.items():
            result = result.replace("{" + key + "}", str(value))
        return result

    def extract_business_context(self, content: str, site_info: dict = None) -> str:
        """
        Extract a professional business summary from scraped content.
        This provides the dynamic 'Business Context' for the agent.
        """
        if not content or len(content.strip()) < 100:
            return f"This is an AI assistant for {self.company_name}."

        site_info_str = ""
        if site_info:
            site_info_str = (
                "### OFFICIAL SITE DATA (ULTIMATE TRUTH FOR IDENTITY)\n"
                f"URL: {site_info.get('url', 'N/A')}\n"
                f"Page Title: {site_info.get('title', 'N/A')}\n"
                f"Description: {site_info.get('description', 'N/A')}\n\n"
            )

        summary_prompt = f"""### Role
- Primary Function: You are a **Business Intelligence Analyst**.
- Task: Summarize the provided website content into a concise, professional "Business Context".

{site_info_str}

### IDENTITY RULES (MANDATORY):
1. **Source of Truth**: The "OFFICIAL SITE DATA" above defines the IDENTITY of the website. 
2. **Distinction**: Do NOT mistake a popular brand (like "Frontech", "Apple", or "Nike") for the company name if the Official Site Title is different (like "Techify Hub" or "Gadget Store").
3. **Owner Identity**: Identify WHO owns this website based on the Site Title and Domain.

### Requirements:
1. Identify the actual Company Name.
2. Comprehensive Summary: Include all major categories, specific services/products mentioned, and auxiliary items (like samagri/puja items) found in the content.
3. Detailed Context: Provide enough detail so the agent "knows" the business's full scope without needing multiple follow-up questions.
4. Mention unique value propositions (shipping, returns, support).
5. Keep it between 500-800 characters.
6. Format: A professional, cohesive series of paragraphs that describes the company, its full range of specializations, and its key value points.

### Website Content:
{{content}}

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
