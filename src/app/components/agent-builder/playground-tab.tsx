import { useState, useEffect, useRef } from 'react';
import { Send, RotateCcw, Bot, User, FileText, Sparkles, Brain, Zap, Database, Target, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { GradientButton } from '../gradient-button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Agent, useAgents } from '@/contexts/AgentsContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  sources?: any[];
  tokens?: number;
  responseTime?: number;
  intent?: string;
  timestamp: number;
  feedback?: 'like' | 'unlike';
  matchedQAPair?: {
    question: string;
    answer: string;
  };
}

interface PlaygroundTabProps {
  agentId?: string;
  responseMode?: 'llm' | 'crewai';
  agent?: Agent;
}

export function PlaygroundTab({ agentId, responseMode = 'llm', agent }: PlaygroundTabProps) {
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleFeedback = (messageId: string, type: 'like' | 'unlike') => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, feedback: m.feedback === type ? undefined : type } : m
    ));
  };

  const { updateAgent } = useAgents();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined' && agentId) {
      const saved = localStorage.getItem(`chat_history_${agentId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing saved messages:', e);
        }
      }
    }
    return [
      {
        id: '1',
        role: 'assistant',
        content: agent?.initialMessage || 'Hello! How can I help you today?',
        confidence: 100,
        timestamp: Date.now(),
      },
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(agent?.useCase || 'general');
  const [instructions, setInstructions] = useState(agent?.useCase || '');
  const [isFetchingSettings, setIsFetchingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [intentConfidence, setIntentConfidence] = useState<number[]>([0.8]);

  // Fetch settings from backend if agentId is available
  useEffect(() => {
    if (!agentId) return;

    const fetchSettings = async () => {
      setIsFetchingSettings(true);
      try {
        const response = await fetch(`/api/agents/persona?agent_id=${agentId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.system_prompt) {
            setInstructions(data.system_prompt);
            if (data.persona_type) {
              setSelectedPersona(data.persona_type);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching agent settings:', error);
      } finally {
        setIsFetchingSettings(false);
      }
    };

    fetchSettings();
  }, [agentId]);

  // Use second useEffect to keep instructions synced with agent prop if it changes
  useEffect(() => {
    if (agent?.useCase) {
      setInstructions(agent.useCase);
    }
  }, [agent?.useCase]);

  // Sync messages with localStorage when agentId changes (for navigation)
  useEffect(() => {
    if (agentId) {
      const savedMessages = localStorage.getItem(`chat_history_${agentId}`);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error('Error parsing saved messages:', e);
        }
      }
    }
  }, [agentId]);

  // Sync initial message with agent prop in real-time
  useEffect(() => {
    const newInitialMessage = agent?.initialMessage;
    if (newInitialMessage) {
      setMessages(prev => {
        if (prev.length === 0) return prev;
        
        // If there's only one message and it's from the assistant, update it
        if (prev.length === 1 && prev[0].role === 'assistant') {
          return [{
            ...prev[0],
            content: newInitialMessage
          }];
        }
        
        // Find the first assistant message and update it if it's at the start
        if (prev[0].role === 'assistant') {
          const newMessages = [...prev];
          newMessages[0] = {
            ...newMessages[0],
            content: newInitialMessage
          };
          return newMessages;
        }
        
        return prev;
      });
    }
  }, [agent?.initialMessage]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (agentId && messages.length > 0) {
      localStorage.setItem(`chat_history_${agentId}`, JSON.stringify(messages));
    }
  }, [messages, agentId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (shouldAutoScroll && messagesContainerRef.current) {
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
    }
  }, [messages, shouldAutoScroll]);

  // Detect if user manually scrolled up
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      setShouldAutoScroll(isNearBottom);
    }
  };

  const handleIntentConfidenceChange = (value: number[]) => {
    setIntentConfidence(value);
  };

  const handleSaveSettings = async () => {
    if (!agentId) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/agents/update-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agentId,
          details: {
            useCase: selectedPersona,
            systemPrompt: instructions
          }
        }),
      });

      if (response.ok) {
        updateAgent(agentId, {
          useCase: instructions
        });
        import('sonner').then(({ toast }) => toast.success('Agent settings saved successfully'));
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      import('sonner').then(({ toast }) => toast.error('Failed to save agent settings'));
    } finally {
      setIsSaving(false);
    }
  };

  // Track mount state to prevent overwriting saved prompt on initial load
  const isMounted = useRef(false);
  const prevAgentId = useRef<string | undefined>(agentId);

  // Fetch persona template when persona changes
  useEffect(() => {
    // 1. Skip on initial load to preserve the agent's actual saved prompt
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    // 2. Skip if agentId just changed (it means fetchSettings is already handling it)
    if (prevAgentId.current !== agentId) {
      prevAgentId.current = agentId;
      return;
    }

    const fetchTemplate = async () => {
      setIsFetchingSettings(true);
      try {
        // Pass agentId if available to get the template pre-filled with business context
        const agentIdParam = agentId ? `&agent_id=${agentId}` : '';
        const response = await fetch(`/api/agents/persona?type=${selectedPersona}${agentIdParam}`);

        if (response.ok) {
          const data = await response.json();
          if (data.system_prompt) {
            setInstructions(data.system_prompt);
          }
        }
      } catch (error) {
        console.error('Error fetching persona template:', error);
      } finally {
        setIsFetchingSettings(false);
      }
    };

    fetchTemplate();
  }, [selectedPersona, agentId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    // Auto-scroll when user sends message
    setShouldAutoScroll(true);
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    });

    try {
      // Call API route
      const response = await fetch(`/api/agents/${agentId || '1'}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          responseMode: responseMode,
          qaPairs: agent?.qaPairs || [],
          intentConfidence: intentConfidence[0],
          history: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          })),
          system_prompt: instructions,
        }),
      });

      const data = await response.json();

      // Fix confidence display - ensure it's between 0-100
      let confidence = data.confidence;
      if (confidence > 100) {
        // If confidence is > 100, it might be a decimal multiplied incorrectly
        confidence = confidence > 1000 ? confidence / 100 : Math.min(confidence, 100);
      } else if (confidence < 1 && confidence > 0) {
        // If confidence is a decimal (0-1), convert to percentage
        confidence = Math.round(confidence * 100);
      } else {
        // Ensure it's within 0-100 range
        confidence = Math.min(Math.max(Math.round(confidence), 0), 100);
      }

      // Create assistant message from API response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text || data.content || 'Sorry, I could not generate a response.',
        confidence: confidence,
        sources: data.sources,
        tokens: data.tokens,
        responseTime: data.responseTime,
        intent: data.intent,
        timestamp: Date.now(),
        matchedQAPair: data.matchedQAPair,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      // Auto-scroll after adding message - ensure we're at bottom
      setShouldAutoScroll(true);
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        confidence: 0,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (agentId) {
      localStorage.removeItem(`chat_history_${agentId}`);
    }
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: agent?.initialMessage || 'Hello! How can I help you today?',
        confidence: 100,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="h-full flex">
      {/* Left panel - Settings */}
      <div className="w-80 border-r border-border p-6 overflow-y-auto scrollbar-hide">
        <h3 className="font-semibold mb-4 scrollbar-hide">Configuration</h3>

        {/* Intent Confidence for RAG */}
        <div className="space-y-6">

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">System Instructions(Prompt)</label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={10}
              className="resize-none"
              placeholder="Enter system instructions..."
            />
          </div>
        </div>

        <GradientButton
          className="w-full mt-6"
          onClick={handleSaveSettings}
          disabled={isSaving || isFetchingSettings}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : 'Save Changes'}
        </GradientButton>
      </div>

      {/* Right panel - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Support Assistant</span>
                  <Badge variant="outline" className="text-xs">
                    {responseMode === 'llm' ? (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        LLM Mode
                      </>
                    ) : (
                      <>
                        <Brain className="h-3 w-3 mr-1" />
                        CrewAI Mode
                      </>
                    )}
                  </Badge>
                </div>
                <div className="text-xs text-text-muted">Testing mode</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClear}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}

              <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-2xl`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-secondary rounded-tl-sm'
                    }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  ) : (
                    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none 
                                  prose-p:leading-relaxed prose-pre:bg-muted prose-pre:p-0
                                  prose-a:text-blue-400 prose-a:underline hover:prose-a:text-blue-500
                                  prose-ul:list-disc prose-ul:ml-4 prose-ol:list-decimal prose-ol:ml-4">
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
                </div>

                {message.role === 'assistant' && (
                  <div className="flex flex-col gap-2 mt-2 text-xs text-text-muted w-full">
                    {/* Time and Feedback Buttons */}
                    <div className="flex items-center gap-4 mt-1">
                      <span>{formatTimeAgo(message.timestamp)}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleFeedback(message.id, 'like')}
                          className={`hover:text-primary transition-colors ${message.feedback === 'like' ? 'text-primary' : ''}`}
                        >
                          <ThumbsUp className={`h-3.5 w-3.5 ${message.feedback === 'like' ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'unlike')}
                          className={`hover:text-destructive transition-colors ${message.feedback === 'unlike' ? 'text-destructive' : ''}`}
                        >
                          <ThumbsDown className={`h-3.5 w-3.5 ${message.feedback === 'unlike' ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
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

          {/* Typing indicator while the assistant is generating a response */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col items-start max-w-2xl">
                <div className="rounded-2xl px-4 py-3 bg-secondary rounded-tl-sm">
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-text-muted mr-2 text-xs uppercase tracking-wide">
                      Typing
                    </span>
                    <span className="flex gap-1 text-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary dot-wave dot-wave-1" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary dot-wave dot-wave-2" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary dot-wave dot-wave-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-xs text-text-muted">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
