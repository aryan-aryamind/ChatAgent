import { useRouter } from 'next/router'
import { CreditCard, ArrowUp, Check } from 'lucide-react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { PageHeader } from '@/app/components/page-header'
import { Button } from '@/app/components/ui/button'
import { GradientButton } from '@/app/components/gradient-button'

export default function BillingPage() {
  const router = useRouter()

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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage="billing" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="p-8">
          <PageHeader
            title="Usage & Billing"
            description="Manage your subscription and view usage statistics"
          />

          <div className="mt-8">
            <div className="bg-card rounded-xl border border-border p-12 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-2xl font-bold">Billing & Usage</h3>
                <p className="text-muted-foreground">
                  Our billing system is currently being updated to provide a better experience.
                </p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-6 max-w-lg mx-auto border border-border">
                <p className="text-sm font-medium mb-2 uppercase tracking-wider text-text-muted">Contact Support</p>
                <p className="text-lg">
                  For billing inquiries, usage increases, or enterprise plans, please email us at:
                </p>
                <a 
                  href="mailto:billing@chatbase.com" 
                  className="text-xl font-bold text-primary hover:underline block mt-2"
                >
                  billing@chatbase.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
