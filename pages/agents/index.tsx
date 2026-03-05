import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { Plus } from 'lucide-react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { AgentCard } from '@/app/components/agent-card'
import { Button } from '@/app/components/ui/button'
import { useAgents } from '@/contexts/AgentsContext'
import { toast } from 'sonner'

export default function AgentsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { agents: contextAgents, deleteAgent } = useAgents()
  const [displayAgents, setDisplayAgents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  const fetchAdminAgents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/list-agents')
      if (response.ok) {
        const data = await response.json()
        setDisplayAgents(data)
      }
    } catch (error) {
      console.error('Error fetching admin agents:', error)
      toast.error('Failed to load platform agents')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchAdminAgents()
    } else {
      setDisplayAgents(contextAgents)
      setIsLoading(false)
    }
  }, [isAdmin, contextAgents])

  const handleStatusUpdate = async (agentId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/manage-agent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, status: newStatus }),
      })
      if (response.ok) {
        toast.success(`Agent status updated to ${newStatus}`)
        if (isAdmin) fetchAdminAgents()
      }
    } catch (error) {
      toast.error('Failed to update agent status')
    }
  }

  const handleExtendExpiry = async (agentId: string) => {
    const newExpiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    try {
      const response = await fetch('/api/admin/manage-agent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, expiresAt: newExpiration }),
      })
      if (response.ok) {
        toast.success('Expiration extended by 30 days')
        if (isAdmin) fetchAdminAgents()
      }
    } catch (error) {
      toast.error('Failed to extend expiration')
    }
  }

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

  const handleDeleteAgent = async (agentId: string) => {
    if (isAdmin) {
      try {
        const response = await fetch(`/api/admin/manage-agent?agentId=${agentId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          toast.success('Agent deleted permanently')
          fetchAdminAgents()
        }
      } catch (error) {
        toast.error('Failed to delete agent')
      }
    } else {
      deleteAgent(agentId)
      if (router.pathname.startsWith('/agents/')) {
        router.push('/agents')
      }
    }
  }

  const filteredAgents = isAdmin
    ? displayAgents
    : displayAgents.filter(a => a.status !== 'hidden')

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
              <h1 className="text-4xl font-bold mb-2">
                {isAdmin ? 'System Agents' : 'My AI Agents'}
              </h1>
              <p className="text-muted-foreground">
                {isAdmin
                  ? 'Overview of all agents on the platform.'
                  : 'Manage and interact with your AI agents'}
              </p>
            </div>
            <Button onClick={handleCreateAgent} size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
              <Plus className="h-5 w-5" />
              New AI agent
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-muted/50 rounded-xl" />
              ))}
            </div>
          ) : filteredAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agentId={agent.id}
                  name={agent.name}
                  status={agent.status}
                  image={agent.image}
                  conversations={agent.conversations || 0}
                  lastActive={agent.lastTrained || 'Never'}
                  ownerEmail={agent.user?.email}
                  ownerName={agent.user?.name}
                  createdAt={agent.createdAt}
                  expiresAt={agent.expiresAt}
                  isAdminView={isAdmin}
                  onClick={() => handleAgentClick(agent.id)}
                  onDelete={handleDeleteAgent}
                  onStatusUpdate={handleStatusUpdate}
                  onExtendExpiry={handleExtendExpiry}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
              <p className="text-muted-foreground mb-6 text-lg">No agents found</p>
              <Button onClick={handleCreateAgent} variant="outline" size="lg">
                Create your first agent
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
