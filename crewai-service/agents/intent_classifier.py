from typing import List, Dict

class IntentClassifierAgent:
    """
    Classifies user queries into intents based on Q&A pairs.
    """
    
    def __init__(self):
        self.intent_keywords = {
            'business_hours': ['hour', 'open', 'time', 'when', 'schedule', 'available'],
            'pricing': ['price', 'cost', 'fee', 'payment', 'plan', 'subscription', 'billing'],
            'support': ['support', 'help', 'assist', 'issue', 'problem', 'trouble'],
            'contact': ['contact', 'email', 'phone', 'reach', 'address', 'location'],
            'refund': ['refund', 'return', 'cancel', 'money back'],
            'product': ['product', 'feature', 'service', 'offer', 'provide'],
            'general': []
        }
    
    def classify(self, message: str, qa_pairs: List[Dict]) -> Dict:
        """
        Classify the user message into an intent.
        
        Returns:
            {
                'intent': str,
                'confidence': float (0-1)
            }
        """
        message_lower = message.lower()
        
        # Check for explicit intents from Q&A pairs - improved matching
        for qa in qa_pairs:
            if qa.get('question'):
                qa_question_lower = qa['question'].lower().strip()
                message_lower_stripped = message_lower.strip()
                
                # Exact match or very close match
                if qa_question_lower == message_lower_stripped:
                    return {
                        'intent': qa.get('intent', 'general'),
                        'confidence': 0.95
                    }
                
                # Check if question is contained in message or vice versa
                if qa_question_lower in message_lower_stripped or message_lower_stripped in qa_question_lower:
                    return {
                        'intent': qa.get('intent', 'general'),
                        'confidence': 0.9
                    }
                
                # Check for key words matching (at least 2 words)
                qa_words = set(qa_question_lower.split())
                msg_words = set(message_lower_stripped.split())
                common_words = qa_words.intersection(msg_words)
                
                # Remove common stop words
                stop_words = {'what', 'is', 'the', 'a', 'an', 'where', 'when', 'how', 'why', 'who', 'which', 'do', 'does', 'did', 'are', 'was', 'were', 'it', 'its', 'this', 'that', 'these', 'those'}
                common_words = common_words - stop_words
                
                if len(common_words) >= 2 or (len(common_words) >= 1 and len(qa_words) <= 3):
                    return {
                        'intent': qa.get('intent', 'general'),
                        'confidence': 0.85
                    }
        
        # Keyword-based classification
        intent_scores = {}
        for intent, keywords in self.intent_keywords.items():
            score = sum(1 for keyword in keywords if keyword in message_lower)
            if score > 0:
                intent_scores[intent] = score
        
        if intent_scores:
            best_intent = max(intent_scores, key=intent_scores.get)
            max_score = intent_scores[best_intent]
            confidence = min(0.95, 0.7 + (max_score * 0.1))
            
            return {
                'intent': best_intent,
                'confidence': confidence
            }
        
        # Default to general
        return {
            'intent': 'general',
            'confidence': 0.6
        }
