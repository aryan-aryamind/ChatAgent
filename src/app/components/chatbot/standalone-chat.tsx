import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { cn } from '../ui/utils';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface StandaloneChatProps {
    agentId: string;
    agentName?: string;
    initialMessage?: string;
    transparent?: boolean;
}

export function StandaloneChat({ agentId, agentName = 'Assistant', initialMessage, transparent }: StandaloneChatProps) {
    // ... state ...
    
    // (Ensure I don't break existing code, so I'll just use the prop in the return)
    
    // Wait, let me just update the function signature and the return.
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: initialMessage || "Hello! I'm here to help. What can I do for you today? 👋",
            timestamp: Date.now(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [personaData, setPersonaData] = useState<any>(null);
    const [currentAgentName, setCurrentAgentName] = useState(agentName);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Fetch settings on mount
    useEffect(() => {
        if (!agentId) return;

        const fetchSettings = async () => {
            try {
                const response = await fetch(`/api/agents/persona?agent_id=${agentId}`);
                if (response.ok) {
                    const data = await response.json();
                    setPersonaData(data);
                    if (data.system_prompt) setSystemPrompt(data.system_prompt);
                    // Also try to get agent name if it's default
                    if (currentAgentName === 'Assistant' && data.agent_name) {
                        setCurrentAgentName(data.agent_name);
                    }
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };

        fetchSettings();
    }, [agentId]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`/api/agents/${agentId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.slice(-6).map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    system_prompt: systemPrompt,
                    persona_type: personaData?.persona_type || 'general',
                }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.text || data.reply || 'Sorry, I could not generate a response.',
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, there was an error processing your message.',
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setMessages([
            {
                id: '1',
                role: 'assistant',
                content: initialMessage || "Hello! I'm here to help. What can I do for you today? 👋",
                timestamp: Date.now(),
            },
        ]);
    };

    const primaryColor = personaData?.primary_color || '#6366F1';
    const secondaryColor = personaData?.secondary_color || '#8B5CF6';
    const headerGradient = `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`;

    return (
        <div className={cn(
            "flex flex-col h-screen text-slate-100 overflow-hidden font-sans selection:bg-primary/30",
            transparent ? "bg-zinc-950/90 backdrop-blur-md" : "bg-zinc-950"
        )}>
            {/* Header */}
            <header 
                className="px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg"
                style={{ background: headerGradient }}
            >
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg ring-2 ring-white/10 uppercase">
                            {currentAgentName.substring(0, 1)}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-primary" />
                    </div>
                    <div>
                        <div className="font-bold text-sm tracking-tight text-white">{currentAgentName}</div>
                        <div className="flex items-center gap-1.5 leading-none mt-0.5">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                            </span>
                            <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 scroll-smooth scrollbar-hide"
            >
                <AnimatePresence initial={false}>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={cn(
                                'flex gap-4',
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            {message.role === 'assistant' && (
                                <div 
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 shadow-lg self-end mb-1 uppercase"
                                    style={{ background: primaryColor }}
                                >
                                    AI
                                </div>
                            )}

                            <div
                                className={cn(
                                    'max-w-[85%] md:max-w-[75%] rounded-[1.5rem] px-5 py-4 text-sm shadow-xl transition-all',
                                    message.role === 'user'
                                        ? 'text-white rounded-br-none'
                                        : 'bg-[#1F2937] text-slate-100 rounded-tl-none border border-white/5'
                                )}
                                style={message.role === 'user' ? { background: primaryColor } : {}}
                            >
                                {message.role === 'user' ? (
                                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                ) : (
                                    <div className="prose prose-sm prose-invert max-w-none 
                                                  prose-p:leading-relaxed prose-pre:bg-black/20 prose-pre:p-4
                                                  prose-strong:text-white prose-headings:text-white">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                a: ({ node, ...props }) => (
                                                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />
                                                )
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                                <div className={cn(
                                    "text-[9px] mt-2 font-black uppercase tracking-wider opacity-40",
                                    message.role === 'user' ? "text-right" : ""
                                )}>
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div 
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-lg"
                            style={{ background: primaryColor }}
                        >
                            AI
                        </div>
                        <div className="bg-[#1F2937] border border-white/5 rounded-2xl rounded-tl-none px-5 py-4 shadow-xl">
                            <div className="flex gap-1.5">
                                <motion.div
                                    className="w-1.5 h-1.5 rounded-full bg-slate-400"
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div
                                    className="w-1.5 h-1.5 rounded-full bg-slate-400"
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div
                                    className="w-1.5 h-1.5 rounded-full bg-slate-400"
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                                />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 pt-2 bg-[#0B0F1A] border-t border-white/5">
                <div className="max-w-4xl mx-auto flex gap-4 items-end">
                    <div className="relative flex-1 group">
                        <Textarea
                            value={input}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type your message..."
                            className="bg-[#1F2937] border-white/10 group-hover:border-primary/50 focus:border-primary min-h-[56px] max-h-[150px] py-4 px-6 rounded-2xl resize-none transition-all duration-300 text-slate-100 placeholder:text-slate-500 shadow-xl focus:ring-1 focus:ring-primary/30"
                            disabled={isLoading}
                        />
                        <div className="absolute right-3 bottom-3 flex items-center gap-2">
                             {/* Optional attachments icon could go here */}
                        </div>
                    </div>
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="h-14 w-14 rounded-2xl transition-all hover:scale-105 active:scale-95 flex-shrink-0 disabled:opacity-30 shadow-2xl"
                        style={{ background: primaryColor }}
                    >
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                        ) : (
                            <Send className="h-6 w-6 text-white" />
                        )}
                    </Button>
                </div>
                <div className="flex items-center justify-center gap-4 mt-6">
                    <div className="h-px flex-1 bg-white/5" />
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                        Powered by AI Agent
                    </div>
                    <div className="h-px flex-1 bg-white/5" />
                </div>
            </div>
        </div>
    );
}
