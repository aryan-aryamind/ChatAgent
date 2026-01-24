import { useRouter } from 'next/router'
import { Sidebar } from '@/app/components/dashboard/sidebar'

export default function TeamPage() {
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
        currentPage="team" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-hidden">
        <div className="p-8">
          <h1 className="capitalize">Team Members</h1>
          <p>Coming soon...</p>
        </div>
      </main>
    </div>
  )
}
