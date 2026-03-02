import { useState, useEffect, useRef } from 'react';
import { Send, RotateCcw, Bot, User, FileText, Sparkles, Brain, Zap, Database, Target, Loader2 } from 'lucide-react';
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
  const { updateAgent } = useAgents();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! How can I help you today?',
      confidence: 100,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(agent?.useCase || 'general');
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([1000]);
  const [instructions, setInstructions] = useState(
    agent?.systemPrompt || 'You are a friendly customer support agent. Be helpful, professional, and concise. Always prioritize customer satisfaction.'
  );
  const [isFetchingSettings, setIsFetchingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [intentConfidence, setIntentConfidence] = useState<number[]>([
    agent?.crewaiSettings?.intentConfidence || 0.8
  ]);

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
    if (agent?.systemPrompt) {
      setInstructions(agent.systemPrompt);
    }
  }, [agent?.systemPrompt]);

  // Update intent confidence when agent changes
  useEffect(() => {
    if (agent?.crewaiSettings?.intentConfidence !== undefined) {
      setIntentConfidence([agent.crewaiSettings.intentConfidence]);
    }
  }, [agent?.crewaiSettings?.intentConfidence]);

  // Load messages from localStorage on mount or when agentId changes
  useEffect(() => {
    if (agentId) {
      const savedMessages = localStorage.getItem(`chat_history_${agentId}`);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error('Error parsing saved messages:', e);
        }
      } else {
        // Default greeting if no history
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: 'Hello! How can I help you today?',
            confidence: 100,
          },
        ]);
      }
    }
  }, [agentId]);

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
    // Update agent in context
    if (agentId && agent) {
      updateAgent(agentId, {
        crewaiSettings: {
          intentConfidence: value[0],
        },
      });
    }
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
          agent_id: agentId,
          persona_type: selectedPersona,
          system_prompt: instructions
        }),
      });

      if (response.ok) {
        updateAgent(agentId, {
          systemPrompt: instructions,
          useCase: selectedPersona
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

  // Fetch persona template when persona changes (mimic Step 4 behavior)
  useEffect(() => {
    // Skip on initial load if we already have agent instructions
    // but allow fetching if the user explicitly changes the persona
    const fetchTemplate = async () => {
      setIsFetchingSettings(true)
      try {
        const agentIdParam = agentId ? `&agent_id=${agentId}` : ''
        const response = await fetch(`/api/agents/persona?type=${selectedPersona}${agentIdParam}`)
        if (response.ok) {
          const data = await response.json()
          if (data.system_prompt) {
            setInstructions(data.system_prompt)
          }
        }
      } catch (error) {
        console.error('Error fetching persona template:', error)
      } finally {
        setIsFetchingSettings(false)
      }
    }

    // Only if it's not the initial mount and the persona actually changed
    // In a real app we might want a ref to check mount state
    fetchTemplate()
  }, [selectedPersona])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
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
          intentConfidence: agent?.crewaiSettings?.intentConfidence || 0.8,
          history: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          })),
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
        content: 'Hello! How can I help you today?',
        confidence: 100,
      },
    ]);
  };

  return (
    <div className="h-full flex">
      {/* Left panel - Settings */}
      <div className="w-80 border-r border-border p-6 overflow-y-auto scrollbar-hide">
        <h3 className="font-semibold mb-4 scrollbar-hide">Configuration</h3>

        {/* LLM Mode Settings */}
        {responseMode === 'llm' && (
          <>
            {/* Persona Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Instructions</label>
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General (Balanced)</SelectItem>
                  <SelectItem value="support">Customer Support (Empathetic)</SelectItem>
                  <SelectItem value="sales">Sales (Goal-Oriented)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Temperature */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Temperature</label>
                <span className="text-sm text-text-muted">{temperature[0]}</span>
              </div>
              <Slider
                value={temperature}
                onValueChange={setTemperature}
                min={0}
                max={1}
                step={0.1}
                className="mb-1"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Max Tokens</label>
                <span className="text-sm text-text-muted">{maxTokens[0]}</span>
              </div>
              <Slider
                value={maxTokens}
                onValueChange={setMaxTokens}
                min={100}
                max={4000}
                step={100}
              />
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">System Instructions(Prompt)</label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={6}
                className="resize-none"
                placeholder="Enter system instructions..."
              />
            </div>
          </>
        )}

        {/* CrewAI Mode Settings */}
        {responseMode === 'crewai' && (
          <div className="space-y-6">
            {/* Accuracy Section */}
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">Accuracy</Label>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Intent Confidence</span>
                  <span className="text-sm font-medium text-primary">
                    {(intentConfidence[0] * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={intentConfidence}
                  onValueChange={handleIntentConfidenceChange}
                  min={0.5}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50%</span>
                  <span>100%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum confidence required for intent matching. Higher values mean more strict matching.
                </p>
              </div>
            </div>

            {/* Data Sources Section */}
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">Data Sources</Label>
              </div>
              <div className="space-y-3">
                {/* Q&A Pairs */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Q&A Pairs</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {agent?.qaPairs?.length || 0}
                  </span>
                </div>

                {/* Total Sources */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Sources</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {agent?.sources || 0}
                  </span>
                </div>

                {/* Q&A Pairs Preview */}
                {agent?.qaPairs && agent.qaPairs.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Sample Q&A Pairs:</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {agent.qaPairs.slice(0, 3).map((pair) => (
                        <div key={pair.id} className="text-xs bg-muted/30 p-2 rounded">
                          <p className="font-medium truncate">Q: {pair.question}</p>
                          {pair.intent && (
                            <p className="text-muted-foreground text-[10px] mt-1">
                              Intent: {pair.intent}
                            </p>
                          )}
                        </div>
                      ))}
                      {agent.qaPairs.length > 3 && (
                        <p className="text-xs text-primary text-center">
                          + {agent.qaPairs.length - 3} more pairs
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(!agent?.qaPairs || agent.qaPairs.length === 0) && (
                  <p className="text-xs text-warning text-center py-2">
                    No Q&A pairs available. Add them in Data Sources tab.
                  </p>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-primary flex items-start gap-2">
                <Zap className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  CrewAI matches user queries to Q&A pairs based on intent similarity.
                  Configure advanced settings in the Settings tab.
                </span>
              </p>
            </div>
          </div>
        )}

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
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>

                {message.role === 'assistant' && (
                  <div className="flex flex-col gap-2 mt-2 text-xs text-text-muted">
                    {message.intent && (
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-primary" />
                        <span className="text-primary font-medium">Intent: {message.intent}</span>
                        {message.confidence && (
                          <span className="text-muted-foreground">
                            ({message.confidence}% confidence)
                          </span>
                        )}
                      </div>
                    )}
                    {message.confidence && !message.intent && (
                      <span className="flex items-center gap-1">
                        Confidence: {message.confidence}%
                      </span>
                    )}
                    {message.matchedQAPair && (
                      <div className="bg-muted/50 p-2 rounded text-xs">
                        <div className="font-medium mb-1">Matched Q&A:</div>
                        <div className="text-muted-foreground">
                          Q: {message.matchedQAPair.question}
                        </div>
                      </div>
                    )}
                    {message.sources && message.sources.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>
                          Sources: {message.sources.map(s =>
                            typeof s === 'string' ? s : (s.title || s.url || 'Unknown Source')
                          ).join(', ')}
                        </span>
                      </div>
                    )}
                    {(message.tokens || message.responseTime) && (
                      <div className="flex items-center gap-3">
                        {message.tokens && <span>{message.tokens} tokens</span>}
                        {message.responseTime && <span>{message.responseTime}s</span>}
                      </div>
                    )}
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
