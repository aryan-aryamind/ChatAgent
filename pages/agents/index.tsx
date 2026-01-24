import { useRouter } from 'next/router'
import { Plus } from 'lucide-react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { AgentCard } from '@/app/components/agent-card'
import { Button } from '@/app/components/ui/button'
import { useAgents } from '@/contexts/AgentsContext'

export default function AgentsPage() {
  const router = useRouter()
  const { agents, deleteAgent } = useAgents()

  const handleNavigate = (page: string) => {
    if (page === 'dashboard') {
      router.push('/dashboard')
    } else if (page === 'profile') {
      router.push('/profile')
    } else if (page === 'agent-builder') {
      router.push('/agents/new')
    } else {
      router.push(`/${page}`)
    }
  }

  const handleCreateAgent = () => {
    router.push('/agents/new')
  }

  const handleAgentClick = (agentId: string) => {
    router.push(`/agents/${agentId}`)
  }

  const handleDeleteAgent = (agentId: string) => {
    deleteAgent(agentId)
    // If we're on the agent page, redirect to agents list
    if (router.pathname.startsWith('/agents/')) {
      router.push('/agents')
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage="agents" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Agents</h1>
              <p className="text-muted-foreground">
                Manage and interact with your AI agents
              </p>
            </div>
            <Button onClick={handleCreateAgent} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              New AI agent
            </Button>
          </div>

          {agents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agentId={agent.id}
                  name={agent.name}
                  status={agent.status}
                  conversations={agent.conversations || 0}
                  lastActive={agent.lastTrained || 'Never'}
                  onClick={() => handleAgentClick(agent.id)}
                  onDelete={handleDeleteAgent}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No agents yet</p>
              <Button onClick={handleCreateAgent} variant="outline">
                Create your first agent
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
