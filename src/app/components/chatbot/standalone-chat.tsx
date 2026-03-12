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
}

export function StandaloneChat({ agentId, agentName = 'Assistant', initialMessage }: StandaloneChatProps) {
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
    const [persona, setPersona] = useState('general');
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
                    if (data.system_prompt) setSystemPrompt(data.system_prompt);
                    if (data.persona_type) setPersona(data.persona_type);
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
                    history: messages.slice(-5).map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    system_prompt: systemPrompt,
                    persona_type: persona,
                }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.text || data.content || 'Sorry, I could not generate a response.',
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

    return (
        <div className="flex flex-col h-screen bg-background/95 backdrop-blur-sm text-foreground overflow-hidden">
            {/* Header */}
            <header className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#D946EF] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300">
                            {currentAgentName.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-success border-2 border-card shadow-sm" />
                    </div>
                    <div>
                        <div className="font-bold text-base tracking-tight">{currentAgentName}</div>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                            </span>
                            <span className="text-[10px] font-medium text-success uppercase tracking-wider">Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="h-9 w-9 rounded-xl hover:bg-secondary/80 text-text-muted hover:text-foreground transition-all"
                        title="Clear conversation"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth scrollbar-hide"
            >
                <AnimatePresence initial={false}>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className={cn(
                                'flex gap-4 group',
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            {message.role === 'assistant' && (
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 shadow-md shadow-primary/20 self-end mb-1">
                                    AI
                                </div>
                            )}

                            <div
                                className={cn(
                                    'max-w-[88%] md:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm shadow-sm transition-all duration-200',
                                    message.role === 'user'
                                        ? 'bg-primary text-white rounded-br-none hover:shadow-lg hover:shadow-primary/10'
                                        : 'bg-card border border-border/50 text-foreground rounded-bl-none hover:border-border hover:shadow-md'
                                )}
                            >
                                {message.role === 'user' ? (
                                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none 
                                                  prose-p:leading-relaxed prose-pre:bg-secondary/50 prose-pre:p-4
                                                  prose-a:text-primary prose-a:font-medium prose-a:underline-offset-4 hover:prose-a:underline
                                                  prose-strong:text-foreground prose-headings:text-foreground">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                a: ({ node, ...props }) => (
                                                    <a {...props} target="_blank" rel="noopener noreferrer" />
                                                )
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                                <div className={cn(
                                    "text-[10px] mt-2 opacity-50 font-medium",
                                    message.role === 'user' ? "text-white/80 text-right" : "text-text-muted"
                                )}>
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            {message.role === 'user' && (
                                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 shadow-sm self-end mb-1">
                                    <User className="h-4 w-4 text-text-muted" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            AI
                        </div>
                        <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex gap-1">
                                <motion.div
                                    className="w-1.5 h-1.5 rounded-full bg-text-muted"
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div
                                    className="w-1.5 h-1.5 rounded-full bg-text-muted"
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div
                                    className="w-1.5 h-1.5 rounded-full bg-text-muted"
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Field */}
            <div className="p-6 border-t border-border bg-card/80 backdrop-blur-md">
                <div className="max-w-4xl mx-auto flex gap-3 items-end">
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
                            placeholder="Message..."
                            className="bg-background/50 border-border group-hover:border-primary/50 focus:border-primary min-h-[50px] max-h-[200px] py-3.5 px-5 rounded-2xl resize-none transition-all duration-200 shadow-inner"
                            disabled={isLoading}
                        />
                        <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-text-muted hover:text-primary transition-colors"
                                type="button"
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex-shrink-0 disabled:scale-100 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4 opacity-30 hover:opacity-100 transition-opacity duration-500">
                    <div className="h-px w-8 bg-border" />
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted">
                        Powered by AI Agent
                    </div>
                    <div className="h-px w-8 bg-border" />
                </div>
            </div>
        </div>
    );
}
