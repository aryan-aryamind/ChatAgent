from typing import List, Dict, Optional, Any

class IntentClassifierAgent:
    """
    Classifies user queries with high precision using LLM and keywords.
    """
    
    SYSTEM_PROMPT = """### Business Context
You are an AI assistant for a professional company.

### Role
- Primary Function: You are a specialized intent classifier. Your task is to categorize the user's message into exactly one category.
- Categories:
  - 'greeting': Casual hello or hi.
  - 'identity': Questions about who you are, the company name, or what you do.
  - 'pricing': Questions about costs, plans, or billing.
  - 'support': Technical help, issues, or assistance.
  - 'contact': How to reach out via email, phone, or location.
  - 'general': Anything else.

### Persona
- Identity: You are a dedicated routing agent. You are precise and do not provide conversational answers.

### Constraints
1. **Output Format**: Return ONLY the lowercase intent name. No explanation, no punctuation.
2. **Focus**: Only classify based on the message. Do not adopt other roles.
3. No Data Divulge: Never mention training data.
"""

    def __init__(self, llm_agent: Optional[Any] = None):
        self.llm_agent = llm_agent
        self.intent_keywords = {
            'greeting': ['hey', 'hi', 'hello', 'greetings', 'morning', 'evening', 'howdy'],
            'identity': ['what is', 'who is', 'tell me about', 'medtrust', 'platform', 'website', 'company'],
            'pricing': ['price', 'cost', 'fee', 'payment', 'plan', 'subscription', 'billing'],
            'support': ['support', 'help', 'assist', 'issue', 'problem', 'trouble'],
            'contact': ['contact', 'email', 'phone', 'reach', 'address', 'location']
        }
    
    def classify(self, message: str, qa_pairs: List[Dict]) -> Dict:
        message_lower = message.lower().strip()
        
        # 1. QA Pair match (High Priority)
        for qa in qa_pairs:
            q = qa.get('question', '').lower().strip()
            if not q: continue
            
            # Exact match or whole word match for longer phrases
            if q == message_lower:
                return {'intent': qa.get('intent', 'general'), 'confidence': 0.95}
            
            # Match as a standalone phrase within the message (requires spaces or boundaries)
            if len(q) > 4 and f" {q} " in f" {message_lower} ":
                return {'intent': qa.get('intent', 'general'), 'confidence': 0.92}

        # 2. Keyword fallback (Fast & Flexible)
        for intent, keywords in self.intent_keywords.items():
            if any(kw in message_lower for kw in keywords):
                # If we have an LLM, refine with higher confidence
                if self.llm_agent and self.llm_agent.available:
                     llm_intent = self.llm_agent.chat(self.SYSTEM_PROMPT, message, max_tokens=10)
                     if llm_intent and llm_intent.lower().strip() in self.intent_keywords:
                         return {'intent': llm_intent.lower().strip(), 'confidence': 0.98}
                return {'intent': intent, 'confidence': 0.85}
        
        # Default to general with enough confidence to bypass strict filters if needed
        return {'intent': 'general', 'confidence': 0.75}
