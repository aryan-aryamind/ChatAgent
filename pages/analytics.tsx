import { useRouter } from 'next/router'
import { TrendingUp, MessageSquare, Users, Clock, BarChart3 } from 'lucide-react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { PageHeader } from '@/app/components/page-header'
import { StatCard } from '@/app/components/stat-card'
import { useAgents } from '@/contexts/AgentsContext'

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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <StatCard
              icon={MessageSquare}
              label="Total Conversations"
              value={totalConversations.toLocaleString()}
              change="+12%"
              trend="up"
            />
            <StatCard
              icon={Users}
              label="Active Agents"
              value={totalAgents.toString()}
              change="+2"
              trend="up"
            />
            <StatCard
              icon={Clock}
              label="Avg Response Time"
              value={avgResponseTime}
              change="-0.5s"
              trend="down"
            />
            <StatCard
              icon={TrendingUp}
              label="Satisfaction Rate"
              value={satisfactionRate}
              change="+3%"
              trend="up"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Conversations Over Time</h3>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chart visualization coming soon</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Agent Performance</h3>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {agent.conversations || 0} conversations
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success">89%</p>
                      <p className="text-xs text-muted-foreground">Satisfaction</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Summary */}
          <div className="mt-8 bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Top Performing Agents</h3>
            <div className="space-y-3">
              {agents.slice(0, 5).map((agent, index) => (
                <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-sm font-semibold">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {agent.conversations || 0} conversations • {agent.lastTrained || 'Never trained'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/agents/${agent.id}`)}
                    className="text-primary hover:underline text-sm"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
