from typing import Dict

class ResponseGeneratorAgent:
    """
    Generates natural responses from matched Q&A pairs.
    """
    
    def generate(self, user_message: str, matched_qa: Dict, intent: str) -> Dict:
        """
        Generate a response from the matched Q&A pair.
        
        Returns:
            {
                'text': str
            }
        """
        # For now, return the answer directly
        # In a more advanced version, you could:
        # - Add context from the user's message
        # - Personalize the response
        # - Add follow-up suggestions
        
        answer = matched_qa.get('answer', '')
        
        # Simple enhancement: make it more conversational
        if not answer.endswith(('.', '!', '?')):
            answer += '.'
        
        return {
            'text': answer
        }
