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

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'month',
      features: ['5 agents', '1,000 messages/month', 'Basic support'],
      current: true,
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'month',
      features: ['50 agents', '50,000 messages/month', 'Priority support', 'Advanced analytics'],
      current: false,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: ['Unlimited agents', 'Unlimited messages', 'Dedicated support', 'Custom integrations'],
      current: false,
    },
  ]

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

          <div className="mt-8 space-y-6">
            {/* Current Usage */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Current Usage</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Credits Used</p>
                  <p className="text-2xl font-bold">2,000 / 12,000</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '17%' }} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Agents</p>
                  <p className="text-2xl font-bold">3 / 5</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Messages This Month</p>
                  <p className="text-2xl font-bold">1,234 / 1,000</p>
                </div>
              </div>
            </div>

            {/* Plans */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Subscription Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`bg-card rounded-lg border p-6 ${
                      plan.current ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                  >
                    {plan.current && (
                      <div className="flex items-center gap-2 mb-4">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Current Plan</span>
                      </div>
                    )}
                    <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">/{plan.period}</span>}
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {plan.current ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <GradientButton className="w-full">
                        {plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                      </GradientButton>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <div className="flex items-center gap-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">No payment method on file</p>
                  <p className="text-sm text-muted-foreground">Add a payment method to upgrade your plan</p>
                </div>
                <Button variant="outline" className="ml-auto">Add Payment Method</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
