import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
        <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Header */}
            <header className="p-4 border-b border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-bold">
                        {currentAgentName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold">{currentAgentName}</div>
                        <div className="text-xs text-text-muted flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-success" />
                            Online
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClear} title="Clear chat">
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </header>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
            >
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            'flex gap-3',
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
                                'max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm',
                                message.role === 'user'
                                    ? 'bg-primary text-white rounded-tr-sm'
                                    : 'bg-secondary rounded-tl-sm'
                            )}
                        >
                            {message.role === 'user' ? (
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            ) : (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5" />
                            </div>
                        )}
                    </div>
                ))}

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
            <div className="p-4 border-t border-border bg-card">
                <div className="max-w-4xl mx-auto flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="flex-1"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <Send className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Send</span>
                    </Button>
                </div>
                <div className="text-[10px] text-text-muted text-center mt-2">
                    Powered by ChatbotAI
                </div>
            </div>
        </div>
    );
}
