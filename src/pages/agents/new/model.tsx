import { useRouter } from 'next/router'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { AgentCreationStep4 } from '@/app/components/agent-creation/step4-model'

export default function AgentModelPage() {
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
        <AgentCreationStep4 />
      </main>
    </div>
  )
}
