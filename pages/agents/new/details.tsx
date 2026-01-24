import { useRouter } from 'next/router'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { AgentCreationStep2 } from '@/app/components/agent-creation/step2-details'

export default function AgentDetailsPage() {
  const router = useRouter()

  const handleNavigate = (page: string) => {
    if (page === 'dashboard') {
      router.push('/dashboard')
    } else if (page === 'profile') {
      router.push('/profile')
    } else {
      router.push(`/${page}`)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage="agent-builder" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-hidden">
        <AgentCreationStep2 />
      </main>
    </div>
  )
}
