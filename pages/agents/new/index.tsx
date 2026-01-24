import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { AgentCreationStep1 } from '@/app/components/agent-creation/step1-start'

export default function NewAgentPage() {
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
        <AgentCreationStep1 />
      </main>
    </div>
  )
}
