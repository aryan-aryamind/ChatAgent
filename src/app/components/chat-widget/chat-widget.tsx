import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, MessageSquare } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '../ui/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useChat } from '@/contexts/ChatContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatWidget({
  agentId,
  transparent,
  defaultOpen = false
}: {
  agentId?: string,
  transparent?: boolean,
  defaultOpen?: boolean
}) {
  const { isOpen: contextOpen, setIsOpen } = useChat();
  const [hasInitializedOpen, setHasInitializedOpen] = useState(false);

  // Use local state for immediate feedback, but sync with context if needed
  // This is tricky because useChat is global. Let's just use setIsOpen on mount if defaultOpen is true.
  useEffect(() => {
    if (defaultOpen && !hasInitializedOpen) {
      setIsOpen(true);
      setHasInitializedOpen(true);
    }
  }, [defaultOpen, setIsOpen, hasInitializedOpen]);

  const isOpen = contextOpen;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentData, setAgentData] = useState<any>(null);
  const [persona, setPersona] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isPlatformBot = !agentId;

  useEffect(() => {
    if (isPlatformBot) {
      setAgentData({
        name: 'TheChatAgent Support',
        initialMessage: "Hi there! 👋 I'm the TheChatAgent assistant.\nHow can I help you today?",
      });
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Hi there! 👋 I'm the TheChatAgent assistant.\nI can help you with features, pricing, and starting your own bot.\n\nWhat would you like to know?",
          timestamp: new Date(),
        },
      ]);
    } else {
      const fetchAgentInfo = async () => {
        try {
          const publicRes = await fetch(`/api/agents/${agentId}/public`);
          if (publicRes.ok) {
            const data = await publicRes.json();
            setAgentData(data);
            setMessages([
              {
                id: '1',
                role: 'assistant',
                content: data.initialMessage || "Hello! How can I help you today?",
                timestamp: new Date(),
              },
            ]);
          }

          const personaRes = await fetch(`/api/agents/persona?agent_id=${agentId}`);
          if (personaRes.ok) {
            const data = await personaRes.json();
            setPersona(data);
          }
        } catch (error) {
          console.error('Error fetching agent info for widget:', error);
        }
      };
      fetchAgentInfo();
    }
  }, [agentId, isPlatformBot]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageToSend?: string) => {
    const text = messageToSend ?? input;
    if (!text.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const historyThreshold = 6;
      const history = updatedMessages.slice(1, -1).slice(-historyThreshold).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const chatUrl = isPlatformBot ? '/api/widget-chat' : `/api/agents/${agentId}/chat`;
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          system_prompt: persona?.system_prompt,
          persona_type: persona?.persona_type
        }),
      });

      const data = await response.json();
      const replyText = data.reply || data.text || "I'm sorry, I couldn't get a response. Please try again.";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I am having trouble connecting right now.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const primaryColor = persona?.primary_color || '#6366F1';
  const secondaryColor = persona?.secondary_color || '#8B5CF6';
  const headerGradient = `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`;

  return (
    <>
      {/* Chat Bubble (Launcher) */}
      <AnimatePresence>
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white z-[9999] transition-all duration-300"
          style={{ background: primaryColor }}
        >
          <AnimatePresence mode="wait">
            {!isOpen ? (
              <motion.div
                key="chat-icon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <MessageSquare className="h-7 w-7" />
              </motion.div>
            ) : (
              <motion.div
                key="close-icon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="h-7 w-7" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </AnimatePresence>

      {/* Main Widget Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className={cn(
              'fixed rounded-[2.5rem] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.6)] border border-white/20 overflow-hidden z-[9999] dark chat-container',
              transparent ? 'bg-black/60 backdrop-blur-[40px]' : 'bg-zinc-900/90 backdrop-blur-[30px]',
              'bottom-28 right-6 md:w-[420px] md:max-w-[420px]',
              'w-[calc(100vw-3rem)] max-w-[calc(100vw-3rem)] h-[650px] max-h-[calc(100vh-8rem)] flex flex-col'
            )}
          >
            {/* Header */}
            <div
              className="p-5 flex items-center justify-between shadow-lg shrink-0"
              style={{ background: headerGradient }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/10 uppercase">
                  {isPlatformBot ? 'AI' : (agentData?.name?.[0] || 'AI')}
                </div>
                <div>
                  <div className="text-white font-bold text-sm truncate max-w-[180px]">
                    {isPlatformBot ? 'TheChatAgent Support' : agentData?.name || 'Support'}
                  </div>
                  <div className="text-white/80 text-[10px] flex items-center gap-1.5 uppercase font-bold tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent/5 scrollbar-hide py-6 backdrop-blur-[2px]">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[9px] font-black flex-shrink-0 self-end mb-1 shadow-sm uppercase"
                      style={{ background: primaryColor }}
                    >
                      AI
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg',
                      message.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-white/[0.07] text-slate-100 rounded-tl-none border border-white/10 backdrop-blur-sm shadow-inner'
                    )}
                    style={message.role === 'user' ? { background: primaryColor } : {}}
                  >
                    {message.role === 'user' ? (
                      message.content.split('\n').map((line, i, arr) => (
                        <span key={i}>
                          {line}
                          {i < arr.length - 1 && <br />}
                        </span>
                      ))
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none 
                                    prose-p:leading-relaxed prose-pre:bg-black/20 prose-pre:p-3
                                    prose-strong:text-white prose-headings:text-white">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node, ...props }) => (
                              <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium" style={{ color: primaryColor }} />
                            )
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex gap-2 justify-start items-center">
                  <div className="w-8 h-8 rounded-full bg-[#1F2937] flex items-center justify-center self-end mb-1 border border-white/5">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-75" />
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={cn(
              "p-4 border-t border-white/10 shrink-0",
              transparent ? "bg-white/5 backdrop-blur-3xl" : "bg-black/20 backdrop-blur-2xl"
            )}>
              <div className="flex gap-2 bg-[#1F2937] p-2 rounded-2xl border border-white/10 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type your message..."
                  className="border-none bg-transparent focus-visible:ring-0 text-sm shadow-none text-slate-100 placeholder:text-slate-500"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isTyping || !input.trim()}
                  className="p-2.5 rounded-xl bg-primary text-white transition-all hover:opacity-90 disabled:opacity-30 flex items-center justify-center shrink-0"
                  style={{ background: primaryColor }}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="text-[9px] text-slate-600 text-center mt-3 font-bold uppercase tracking-[0.2em]">
                Powered by AI Agent
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}