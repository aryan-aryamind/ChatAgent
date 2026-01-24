import { useRouter } from 'next/router'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { AgentBuilder } from '@/app/components/agent-builder/agent-builder'
import { useAgents } from '@/contexts/AgentsContext'

export default function AgentBuilderPage() {
  const router = useRouter()
  const { id } = router.query
  const { getAgent } = useAgents()
  const agentId = id === 'new' ? null : (id as string)
  const agent = agentId ? getAgent(agentId) : null

  const handleNavigate = (page: string) => {
    if (page === 'dashboard') {
      router.push('/dashboard')
    } else if (page === 'profile') {
      router.push('/profile')
    } else if (page === 'agents') {
      router.push('/agents')
    } else {
      router.push(`/${page}`)
    }
  }

  // Redirect to agents page if agent not found (unless it's a new agent)
  if (agentId && !agent && id !== 'new') {
    router.push('/agents')
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage="agent-builder" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-hidden">
        <AgentBuilder
          agentId={agentId}
          onBack={() => router.push('/agents')}
        />
      </main>
    </div>
  )
}
