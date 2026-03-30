import { useRouter } from 'next/router'
import { useState, useMemo, useEffect } from 'react'
import { Check, Sparkles, ArrowUp, Brain, Zap, ArrowLeft } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Label } from '@/app/components/ui/label'
import { Slider } from '@/app/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group'
import { useAgentCreation } from '@/contexts/AgentCreationContext'
import { useAgents } from '@/contexts/AgentsContext'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

export function AgentCreationStep4() {
  const router = useRouter()
  const { state, setSelectedModel, setResponseMode, reset, setStep } = useAgentCreation()
  const { data: session } = useSession()
  const { addAgent } = useAgents()
  const [selectedPersona, setSelectedPersona] = useState(state.details?.useCase || 'general')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [isFetchingPrompt, setIsFetchingPrompt] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Fetch persona template when persona changes or on initial load
  useEffect(() => {
    const fetchPersona = async () => {
      setIsFetchingPrompt(true)
      try {
        const agentId = state.tempAgentId || state.agentId
        let url = `/api/agents/persona?type=${selectedPersona}`
        if (agentId) {
          url += `&agent_id=${agentId}`
        }

        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          if (data.system_prompt) {
            setSystemPrompt(data.system_prompt)
          }
        }
      } catch (error) {
        console.error('Error fetching persona:', error)
      } finally {
        setIsFetchingPrompt(false)
      }
    }

    fetchPersona()
  }, [selectedPersona, state.tempAgentId, state.agentId])

  const handleBack = () => {
    setStep(2)
    router.push('/agents/new/sources')
  }
  const handleCreateAgent = async () => {
    setIsCreating(true)

    // Extract agent name from sources, website URL, or use default
    let agentName = 'Untitled Agent'
    
    if (state.details?.name) {
      agentName = state.details.name
    } else if (state.sources.length > 0) {
      // Use the name of the first source (e.g., PDF filename or improved backend title)
      const firstSource = state.sources[0]
      const genericNames = ['link source', 'file source', 'Untitled document', 'Untitled', 'None', 'PDF', 'Document', 'Scraped Website']
      
      // Helper to detect if a name is just a URL
      const isUrl = (str: string) => {
        try {
          return str.includes('://') || str.startsWith('www.') || (str.split('.').length > 1 && !str.includes(' '));
        } catch {
          return false;
        }
      }

      if (firstSource.name && !genericNames.includes(firstSource.name) && !isUrl(firstSource.name)) {
        // Strip file extension if present
        agentName = firstSource.name.replace(/\.[^/.]+$/, "")
      } else if (state.details?.websiteUrl || (firstSource.name && isUrl(firstSource.name))) {
        try {
          const urlToParse = state.details?.websiteUrl || (firstSource.name.startsWith('http') ? firstSource.name : `https://${firstSource.name}`)
          const url = new URL(urlToParse)
          const domain = url.hostname.replace('www.', '')
          const domainParts = domain.split('.')
          const domainName = domainParts[0]
          agentName = domainName.charAt(0).toUpperCase() + domainName.slice(1)
        } catch (e) {
          agentName = 'New Agent'
        }
      }
    }

    // Set expiration based on user plan (Extended to 7 days for FREE agents)
    const expiresAt = (session?.user as any)?.plan === 'FREE'
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Call real API to create agent in database
    let createdAgent;
    try {
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          websiteUrl: state.details?.websiteUrl,
          useCase: systemPrompt || state.details?.useCase,
          lastTrained: 'Just now',
          status: 'active',
          conversations: 0,
          sources: state.sources.length,
          expiresAt: expiresAt,
          initialMessage: "Hey! I'm here to help. What can I do for you today? 👋"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503 || errorData.code === 'SERVICE_OFFLINE') {
          toast.error('Model is not working, please contact the team. Server is down currently or please try again later.', { duration: 10000 });
        } else {
          throw new Error('Failed to save agent to database');
        }
        setIsCreating(false);
        return;
      }

      createdAgent = await response.json();
    } catch (error) {
      console.error('Database sync error:', error);
      toast.error('Failed to sync agent to database');
      setIsCreating(false);
      return;
    }

    // Add agent to the local list (for backward compatibility/consistency)
    addAgent({
      ...createdAgent,
      id: createdAgent.id, // Ensure we use the DB ID
    })

    // Rename content/vector store if we have a temporary agent ID from scraping
    if (state.tempAgentId) {
      try {
        console.log(`Renaming content from ${state.tempAgentId} to ${createdAgent.id}`)
        toast.info('Finalizing agent knowledge base...')

        await fetch('/api/agents/rename', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oldAgentId: state.tempAgentId,
            newAgentId: createdAgent.id,
          }),
        })
        console.log('Agent content renamed successfully')
      } catch (error) {
        console.error('Error renaming agent content:', error)
        toast.warning('Agent created, but knowledge base connection may need attention')
      }
    }

    toast.success('Agent created successfully!')

    // Reset context and redirect to agents page
    reset()
    router.push('/agents')
  }

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
            <div>
              <Label className="mb-2 block">Instructions / Persona</Label>
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger>
                  <SelectValue placeholder="Select persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General AI agent</SelectItem>
                  <SelectItem value="support">Customer Support</SelectItem>
                  <SelectItem value="sales">Sales Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block flex items-center justify-between">
                <span>Custom Instructions</span>
                {isFetchingPrompt && (
                  <span className="text-[10px] animate-pulse text-primary font-medium">Fetching details...</span>
                )}
              </Label>
              <div className={`bg-muted rounded-lg p-4 max-h-64 overflow-y-auto transition-opacity ${isFetchingPrompt ? 'opacity-50' : 'opacity-100'}`}>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Your agent instructions will appear here based on your content..."
                  className="w-full bg-transparent text-sm resize-none outline-none"
                  rows={10}
                />
              </div>
            </div>

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
