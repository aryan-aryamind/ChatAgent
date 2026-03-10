import { useState, useEffect } from 'react';
import { Upload, X, Plus, Trash2, Sparkles, Brain, Zap } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { GradientButton } from '../gradient-button';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useAgents } from '@/contexts/AgentsContext';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

interface SettingsTabProps {
  agentStatus: 'active' | 'disabled';
  onStatusChange: (status: 'active' | 'disabled') => void;
  agentId?: string;
}

export function SettingsTab({ agentStatus, onStatusChange, agentId }: SettingsTabProps) {
  const router = useRouter();
  const { getAgent, updateAgent, deleteAgent } = useAgents();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const agent = agentId ? getAgent(agentId) : undefined;
  const [agentName, setAgentName] = useState(agent?.name || 'Support Assistant');

  useEffect(() => {
    if (agent) {
      setAgentName(agent.name);
    }
  }, [agent]);
  const [description, setDescription] = useState('Helps customers with product questions');
  const [initialMessage, setInitialMessage] = useState(
    "Hey! I'm here to help. What can I do for you today? 👋"
  );
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    'What are your pricing plans?',
    'How do I get started?',
    'Do you offer customer support?',
  ]);
  const [rateLimit, setRateLimit] = useState('10');
  const [rateLimitPeriod, setRateLimitPeriod] = useState('hour');

  // Model tab states
  const [responseMode, setResponseMode] = useState<'llm' | 'crewai'>('llm');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([1000]);
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful customer support agent for [Company]. Be friendly, professional, and concise. Always prioritize customer satisfaction.\n\nKey guidelines:\n- Use only provided knowledge\n- Don\'t make up information\n- Escalate complex issues'
  );
  const [intentConfidence, setIntentConfidence] = useState([0.8]);
  const [qaPairsCount, setQAPairsCount] = useState(0); // This would come from agent data

  const addSuggestedQuestion = () => {
    setSuggestedQuestions([...suggestedQuestions, '']);
  };

  const removeSuggestedQuestion = (index: number) => {
    setSuggestedQuestions(suggestedQuestions.filter((_, i) => i !== index));
  };

  const updateSuggestedQuestion = (index: number, value: string) => {
    const updated = [...suggestedQuestions];
    updated[index] = value;
    setSuggestedQuestions(updated);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-text-secondary">Configure your agent's behavior and appearance</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="model">Model</TabsTrigger>
          <TabsTrigger value="interface">Chat Interface</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Agent Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Agent Name</label>
            <Input
              value={agentName}
              onChange={(e) => {
                setAgentName(e.target.value);
                if (agentId) {
                  updateAgent(agentId, { name: e.target.value });
                }
              }}
              onBlur={() => {
                if (agentId && agentName.trim()) {
                  updateAgent(agentId, { name: agentName.trim() });
                }
              }}
              placeholder="Enter agent name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Agent Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this agent does"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Agent Status</label>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-secondary">
              <Switch
                checked={agentStatus === 'active'}
                onCheckedChange={(checked) =>
                  onStatusChange(checked ? 'active' : 'disabled')
                }
              />
              <div className="flex-1">
                <div className="font-medium">
                  {agentStatus === 'active' ? 'Enabled' : 'Disabled'}
                </div>
                <div className="text-sm text-text-muted">
                  {agentStatus === 'active'
                    ? 'Agent is live and accepting conversations'
                    : 'Only workspace members can access'}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-xl font-bold">
                SA
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Change
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent">
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* Initial Message */}
          <div>
            <label className="block text-sm font-medium mb-2">Initial Message</label>
            <Textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              rows={3}
              placeholder="The first message users see..."
            />
          </div>

          {/* Suggested Questions */}
          <div>
            <label className="block text-sm font-medium mb-2">Suggested Questions</label>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={question}
                    onChange={(e) => updateSuggestedQuestion(index, e.target.value)}
                    placeholder="Enter a suggested question"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSuggestedQuestion(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addSuggestedQuestion}
                className="bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>

          {/* Rate Limiting */}
          <div>
            <label className="block text-sm font-medium mb-2">Rate Limiting</label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-text-muted">messages per</span>
              <Select value={rateLimitPeriod} onValueChange={setRateLimitPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minute">minute</SelectItem>
                  <SelectItem value="hour">hour</SelectItem>
                  <SelectItem value="day">day</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-text-muted">per device</span>
            </div>
          </div>

          <GradientButton>Save Changes</GradientButton>
        </TabsContent>

        <TabsContent value="model" className="space-y-6">
          {/* Response Mode Selection */}
          <div>
            <Label className="mb-3 block text-base font-semibold">Response Engine</Label>
            <RadioGroup
              value={responseMode}
              onValueChange={(value) => setResponseMode(value as 'llm' | 'crewai')}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="llm" id="settings-llm-mode" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="settings-llm-mode" className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-medium">LLM Mode</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use GPT, Claude, or Gemini models for flexible AI responses
                    </p>
                  </Label>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="crewai" id="settings-crewai-mode" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="settings-crewai-mode" className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="font-medium">CrewAI Mode</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Intent-based responses using Q&A pairs. Best for structured knowledge.
                    </p>
                    {qaPairsCount > 0 && (
                      <p className="text-xs text-primary mt-1">
                        ✓ {qaPairsCount} Q&A pairs available
                      </p>
                    )}
                    {qaPairsCount === 0 && (
                      <p className="text-xs text-warning mt-1">
                        ⚠ Add Q&A pairs in Data Sources tab
                      </p>
                    )}
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* LLM Mode Settings */}
          {responseMode === 'llm' && (
            <>
              {/* AI Model */}
              <div>
                <label className="block text-sm font-medium mb-2">AI Model</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast, cost-effective)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (Most capable)</SelectItem>
                    <SelectItem value="claude-sonnet">Claude Sonnet 4.5 (Balanced)</SelectItem>
                    <SelectItem value="claude-opus">Claude Opus 4.5 (Advanced reasoning)</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro (Google AI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              {/* 
              <div>
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
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-text-muted">
                  <span>0 = Precise</span>
                  <span>1 = Creative</span>
                </div>
              </div>
              */}

              {/* Max Tokens */}
              {/* 
              <div>
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
              */}

              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Instructions (System Prompt)
                </label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={10}
                  placeholder="Enter system instructions..."
                />
                <div className="mt-2">
                  <Select defaultValue="">
                    <SelectTrigger>
                      <SelectValue placeholder="Use Template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">Customer Support Template</SelectItem>
                      <SelectItem value="sales">Sales Assistant Template</SelectItem>
                      <SelectItem value="faq">FAQ Bot Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* CrewAI Mode Settings */}
          {responseMode === 'crewai' && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div>
                <Label className="mb-2 block">Q&A Pairs Summary</Label>
                {qaPairsCount > 0 ? (
                  <p className="text-sm">
                    <span className="font-semibold text-primary">{qaPairsCount}</span> Q&A pairs available for intent matching
                  </p>
                ) : (
                  <p className="text-sm text-warning">
                    No Q&A pairs found. Add Q&A pairs in the Data Sources tab.
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-2 block">Intent Confidence Threshold</Label>
                <div className="space-y-2">
                  <Slider
                    value={intentConfidence}
                    onValueChange={setIntentConfidence}
                    max={1}
                    min={0.5}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{(intentConfidence[0] * 100).toFixed(0)}%</span>
                    <span>Minimum confidence for intent matching</span>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-primary">
                  <Zap className="h-3 w-3 inline mr-1" />
                  CrewAI matches user queries to Q&A pairs based on intent similarity.
                </p>
              </div>
            </div>
          )}

          <GradientButton>Save Changes</GradientButton>
        </TabsContent>

        <TabsContent value="interface" className="space-y-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <p className="text-sm text-text-secondary mb-4">
              Chat interface customization options will be available in the Deploy tab
            </p>
            <Button variant="outline" className="bg-transparent">
              Go to Deploy →
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="border border-destructive rounded-xl p-6 bg-destructive/5">
            <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-text-secondary mb-4">
              Once you delete an agent, there is no going back. Please be certain.
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Agent
            </Button>
          </div>
        </TabsContent>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Agent</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{agentName}</strong>? This action cannot be undone and all associated data will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (agentId) {
                    deleteAgent(agentId);
                    toast.success('Agent deleted successfully');
                    router.push('/agents');
                  }
                  setShowDeleteDialog(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Tabs>
    </div>
  );
}
