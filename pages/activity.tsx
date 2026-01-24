import { useRouter } from 'next/router'
import { MessageSquare, Clock, User, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { PageHeader } from '@/app/components/page-header'
import { useAgents } from '@/contexts/AgentsContext'

export default function ActivityPage() {
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

  // Mock activity data
  const activities = [
    {
      id: '1',
      user: 'Sarah M.',
      agent: 'Support Agent',
      message: 'How can I reset my password?',
      time: '5 minutes ago',
      status: 'resolved',
      agentId: '1',
    },
    {
      id: '2',
      user: 'John D.',
      agent: 'Sales Assistant',
      message: 'What are your pricing plans?',
      time: '12 minutes ago',
      status: 'active',
      agentId: '2',
    },
    {
      id: '3',
      user: 'Emily R.',
      agent: 'Support Agent',
      message: 'I need help with my account',
      time: '1 hour ago',
      status: 'resolved',
      agentId: '1',
    },
    {
      id: '4',
      user: 'Mike C.',
      agent: 'Sales Assistant',
      message: 'Can I get a demo?',
      time: '2 hours ago',
      status: 'escalated',
      agentId: '2',
    },
    {
      id: '5',
      user: 'Lisa K.',
      agent: 'Shweta Technologies',
      message: 'Tell me about your services',
      time: '3 hours ago',
      status: 'resolved',
      agentId: agents[0]?.id || '1',
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4 text-success" />
      case 'active':
        return <Clock className="h-4 w-4 text-info" />
      case 'escalated':
        return <AlertCircle className="h-4 w-4 text-warning" />
      default:
        return <XCircle className="h-4 w-4 text-destructive" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-success/10 text-success'
      case 'active':
        return 'bg-info/10 text-info'
      case 'escalated':
        return 'bg-warning/10 text-warning'
      default:
        return 'bg-destructive/10 text-destructive'
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage="activity" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="p-8">
          <PageHeader
            title="Activity"
            description="View all conversations and interactions across your agents"
          />

          <div className="mt-8 bg-card rounded-lg border">
            <div className="p-6">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-sm font-semibold">
                        {activity.user.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{activity.user}</span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{activity.agent}</span>
                        </div>
                        <p className="text-sm text-foreground mb-2">{activity.message}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {getStatusIcon(activity.status)}
                        <span className="capitalize">{activity.status}</span>
                      </div>
                      <button
                        onClick={() => router.push(`/agents/${activity.agentId}`)}
                        className="text-primary hover:underline text-sm"
                      >
                        View Agent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
