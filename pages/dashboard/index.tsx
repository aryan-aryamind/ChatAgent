import { useRouter } from 'next/router'
import { useState } from 'react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { DashboardHome } from '@/app/components/dashboard/dashboard-home'

export default function DashboardPage() {
  const router = useRouter()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  const handleNavigate = (page: string) => {
    if (page === 'agent-builder') {
      router.push('/agents/new')
    } else if (page === 'profile') {
      router.push('/profile')
    } else {
      router.push(`/${page}`)
    }
  }

  const handleNavigateToAgent = (agentId: string) => {
    router.push(`/agents/${agentId}`)
  }

  const handleCreateAgent = () => {
    router.push('/agents/new')
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentPage="dashboard"
        onNavigate={handleNavigate}
      />

      <main className="flex-1 ml-60 overflow-hidden">
        <DashboardHome
          onNavigateToAgent={handleNavigateToAgent}
          onCreateAgent={handleCreateAgent}
        />
      </main>
    </div>
  )
}
