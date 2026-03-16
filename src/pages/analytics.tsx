import { useRouter } from 'next/router'
import { TrendingUp, MessageSquare, Users, Clock, BarChart3 } from 'lucide-react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { PageHeader } from '@/app/components/page-header'
import { StatCard } from '@/app/components/stat-card'
import { useAgents } from '@/contexts/AgentsContext'
import { ComingSoon } from '@/app/components/coming-soon'

export default function AnalyticsPage() {
  const router = useRouter()
  const { agents } = useAgents()

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

  // Calculate totals from all agents
  const totalConversations = agents.reduce((sum, agent) => sum + (agent.conversations || 0), 0)
  const totalAgents = agents.length
  const avgResponseTime = '2.3s'
  const satisfactionRate = '89%'

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage="analytics" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="p-8">
          <PageHeader
            title="Analytics"
            description="Overview of your workspace performance and metrics"
          />

          <ComingSoon 
            title="Workspace Analytics" 
            description="Deep insights into your agent's performance, user behavior, and satisfaction trends are coming soon." 
          />
        </div>
      </main>
    </div>
  )
}
