import { useRouter } from 'next/router'
import { useState, useMemo } from 'react'
import { Check, Sparkles, ArrowUp, Brain, Zap, ArrowLeft } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Label } from '@/app/components/ui/label'
import { Slider } from '@/app/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group'
import { useAgentCreation } from '@/contexts/AgentCreationContext'
import { useAgents } from '@/contexts/AgentsContext'
import { toast } from 'sonner'

const availableModels = [
  { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
  { id: 'gpt-3.5', name: 'GPT-3.5', description: 'Fast and efficient' },
  { id: 'gpt-5.1', name: 'GPT-5.1', description: 'Latest model (Premium)' },
  { id: 'claude-3', name: 'Claude 3', description: 'Anthropic model' },
]

export function AgentCreationStep4() {
  const router = useRouter()
  const { state, setSelectedModel, setResponseMode, reset, setStep } = useAgentCreation()
  const { addAgent } = useAgents()
  const [selectedModelId, setSelectedModelId] = useState('gpt-5.1')
  const [temperature, setTemperature] = useState([0])
  const [maxTokens, setMaxTokens] = useState([1000])
  const [systemPrompt, setSystemPrompt] = useState('')
  const [intentConfidence, setIntentConfidence] = useState([0.8])
  const [isCreating, setIsCreating] = useState(false)

  const responseMode = state.responseMode || 'llm'

  // Get all Q&A pairs from sources (including scraped links and manual Q&A)
  const allQAPairs = useMemo(() => {
    return state.sources
      .filter((source) => (source.type === 'qa' || source.type === 'link') && source.qaPairs)
      .flatMap((source) => source.qaPairs || [])
  }, [state.sources])

  const qaPairsCount = allQAPairs.length

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId)
    setSelectedModel(modelId)
  }

  const handleResponseModeChange = (mode: 'llm' | 'crewai') => {
    setResponseMode(mode)
    if (mode === 'crewai' && qaPairsCount === 0) {
      toast.warning('Add Q&A pairs first for CrewAI mode to work effectively')
    }
  }

  const handleBack = () => {
    setStep(3)
    router.push('/agents/new/sources')
  }

  const handleCreateAgent = async () => {
    setIsCreating(true)
    
    // Simulate API call to create agent
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    // Extract agent name from website URL or use default
    let agentName = 'Untitled Agent'
    if (state.details?.websiteUrl) {
      try {
        const url = new URL(state.details.websiteUrl)
        const domain = url.hostname.replace('www.', '')
        const domainName = domain.split('.')[0]
        // Capitalize first letter and add rest
        agentName = domainName.charAt(0).toUpperCase() + domainName.slice(1)
      } catch (e) {
        // If URL parsing fails, use a default name
        agentName = 'New Agent'
      }
    } else if (state.details?.name) {
      agentName = state.details.name
    }

    // Create the agent object
    const newAgent = {
      id: Date.now().toString(),
      name: agentName,
      websiteUrl: state.details?.websiteUrl,
      useCase: state.details?.useCase,
      responseMode: responseMode,
      model: responseMode === 'llm' ? selectedModelId : undefined,
      temperature: responseMode === 'llm' ? temperature[0] : undefined,
      maxTokens: responseMode === 'llm' ? maxTokens[0] : undefined,
      systemPrompt: responseMode === 'llm' ? systemPrompt : undefined,
      qaPairs: responseMode === 'crewai' ? allQAPairs : undefined,
      crewaiSettings: responseMode === 'crewai' ? {
        intentConfidence: intentConfidence[0],
      } : undefined,
      lastTrained: 'Just now',
      status: 'active' as const,
      conversations: 0,
      sources: state.sources.length,
    }
    
    // Add agent to the list
    addAgent(newAgent)
    
    toast.success('Agent created successfully!')
    
    // Reset context and redirect to agents page
    reset()
    router.push('/agents')
  }

  const selectedModel = availableModels.find((m) => m.id === selectedModelId)

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Agent's personality</h1>
          <p className="text-muted-foreground text-lg">
            Select a prompt, customize the instructions, and choose your model.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="bg-card rounded-lg border p-6 space-y-6">
            {/* Response Mode Selection */}
            <div>
              <Label className="mb-3 block text-base font-semibold">Response Engine</Label>
              <RadioGroup
                value={responseMode}
                onValueChange={(value) => handleResponseModeChange(value as 'llm' | 'crewai')}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="llm" id="llm-mode" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="llm-mode" className="cursor-pointer">
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
                  <RadioGroupItem value="crewai" id="crewai-mode" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="crewai-mode" className="cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="font-medium">CrewAI Mode</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Intent-based responses using Q&A pairs. Best for structured knowledge.
                      </p>
                      {qaPairsCount > 0 && (
                        <p className="text-xs text-primary mt-1">
                          ✓ {qaPairsCount} Q&A pairs ready
                        </p>
                      )}
                      {qaPairsCount === 0 && (
                        <p className="text-xs text-warning mt-1">
                          ⚠ Add Q&A pairs in Step 2 for best results
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
                <div>
                  <Label className="mb-2 block">Model</Label>
              <Select value={selectedModelId} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <SelectValue>{selectedModel?.name}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedModelId === 'gpt-5.1' && (
                <div className="mt-2 p-3 bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/20 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Upgrade for more advanced models</span>
                  <Button variant="outline" size="sm">
                    <ArrowUp className="h-4 w-4 mr-1" />
                    Upgrade
                  </Button>
                </div>
              )}
                </div>

                <div>
                  <Label className="mb-2 block">Instructions</Label>
                  <Select defaultValue="general">
                    <SelectTrigger>
                      <SelectValue>General AI agent</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General AI agent</SelectItem>
                      <SelectItem value="support">Customer Support</SelectItem>
                      <SelectItem value="sales">Sales Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Temperature</Label>
                  <div className="space-y-2">
                    <Slider
                      value={temperature}
                      onValueChange={setTemperature}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Reserved</span>
                      <span>Creative</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Max Tokens</Label>
                  <div className="space-y-2">
                    <Slider
                      value={maxTokens}
                      onValueChange={setMaxTokens}
                      min={100}
                      max={4000}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{maxTokens[0]} tokens</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">System Prompt</Label>
                  <div className="bg-muted rounded-lg p-4 max-h-48 overflow-y-auto">
                    <textarea
                      value={systemPrompt || (state.details?.name
                        ? `### Business Context\n${state.details.name} is a company that provides services.`
                        : '### Business Context\nYour agent instructions will appear here...')}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="w-full bg-transparent text-sm resize-none outline-none"
                      rows={6}
                    />
                  </div>
                </div>
              </>
            )}

            {/* CrewAI Mode Settings */}
            {responseMode === 'crewai' && (
              <>
                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                  <div>
                    <Label className="mb-2 block">Q&A Pairs Summary</Label>
                    {qaPairsCount > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-semibold text-primary">{qaPairsCount}</span> Q&A pairs ready for training
                        </p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {allQAPairs.slice(0, 3).map((pair) => (
                            <div key={pair.id} className="truncate">
                              • {pair.question}
                            </div>
                          ))}
                          {qaPairsCount > 3 && (
                            <div className="text-primary">+ {qaPairsCount - 3} more pairs</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-warning">
                        No Q&A pairs found. Add Q&A pairs in Step 2 for CrewAI to work.
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
                      CrewAI will match user queries to your Q&A pairs based on intent similarity.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4 pt-6 border-t">
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleCreateAgent}
                disabled={isCreating}
                className="flex items-center gap-2"
                size="lg"
              >
                {isCreating ? 'Creating Agent...' : 'Create Agent'}
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-muted/30 rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Preview</h3>
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {state.details?.name?.[0] || 'A'}
                  </div>
                  <span className="font-medium">{state.details?.name || 'Agent Name'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm">Hey, how can I help you today?</p>
                </div>
                <div className="bg-primary text-primary-foreground rounded-lg p-3 ml-auto max-w-[80%]">
                  <p className="text-sm">I like AI Agents</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
