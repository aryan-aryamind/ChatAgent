import { useRouter } from 'next/router'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { ProfileSettings } from '@/app/components/profile/profile-settings'

export default function ProfilePage() {
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
        currentPage="profile" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-y-auto scrollbar-hide h-screen">
        <ProfileSettings />
      </main>
    </div>
  )
}
