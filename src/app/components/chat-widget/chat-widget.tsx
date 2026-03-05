import { useState } from 'react';
import { MessageCircle, X, Minimize2, Send, Paperclip } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../ui/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey! I'm here to help. What can I do for you today? 👋",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedQuestions = [
    'What are your pricing plans?',
    'How do I get started?',
    'Do you offer customer support?',
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Great question! Let me help you with that. We offer three pricing plans: Hobby ($40/mo), Standard ($150/mo), and Pro ($500/mo). Each plan includes different features to suit your needs. Would you like more details about any specific plan?',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    handleSend();
  };

  return (
    <>
      {/* Chat Bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] shadow-xl flex items-center justify-center text-white z-50 hover:shadow-2xl transition-shadow"
          >
            <MessageCircle className="h-7 w-7" />
            {/* Notification badge */}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center text-xs font-bold">
              1
            </div>
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] animate-ping opacity-20" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              'fixed rounded-2xl shadow-2xl bg-card border border-border overflow-hidden z-50',
              'bottom-6 right-6 md:w-[400px] md:max-w-[400px]',
              'w-[calc(100vw-3rem)] max-w-[calc(100vw-3rem)]',
              isMinimized ? 'h-16' : 'md:h-[600px] h-[calc(100vh-6rem)] max-h-[600px]'
            )}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                  AI
                </div>
                <div>
                  <div className="text-white font-semibold">Support Assistant</div>
                  <div className="text-white/80 text-xs flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="h-[460px] overflow-y-auto p-4 space-y-4 bg-background">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-2',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          AI
                        </div>
                      )}

                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                          message.role === 'user'
                            ? 'bg-primary text-white rounded-tr-sm'
                            : 'bg-secondary rounded-tl-sm'
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}

                  {/* Suggested questions (only show initially) */}
                  {messages.length === 1 && (
                    <div className="space-y-2">
                      {suggestedQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestedQuestion(question)}
                          className="block w-full text-left px-4 py-2.5 rounded-xl bg-secondary hover:bg-bg-hover transition-colors text-sm"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold">
                        AI
                      </div>
                      <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <motion.div
                            className="w-2 h-2 rounded-full bg-text-muted"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div
                            className="w-2 h-2 rounded-full bg-text-muted"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="w-2 h-2 rounded-full bg-text-muted"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border bg-card">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                      <Paperclip className="h-5 w-5 text-text-muted" />
                    </button>
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <button
                      onClick={handleSend}
                      className="p-2 bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                    >
                      <Send className="h-5 w-5 text-white" />
                    </button>
                  </div>
                  <div className="text-xs text-text-muted text-center mt-2">
                    Powered by ChatbotAI
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}