import { useRouter } from 'next/router'
import { Plug, Plus, Check, ExternalLink } from 'lucide-react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { PageHeader } from '@/app/components/page-header'
import { Button } from '@/app/components/ui/button'

export default function IntegrationsPage() {
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

  const integrations = [
    {
      id: '1',
      name: 'Slack',
      description: 'Get notifications and manage agents from Slack',
      icon: '💬',
      connected: true,
    },
    {
      id: '2',
      name: 'Discord',
      description: 'Deploy your agent to Discord servers',
      icon: '🎮',
      connected: false,
    },
    {
      id: '3',
      name: 'WhatsApp',
      description: 'Connect your agent to WhatsApp Business',
      icon: '📱',
      connected: false,
    },
    {
      id: '4',
      name: 'Zapier',
      description: 'Automate workflows with Zapier integrations',
      icon: '⚡',
      connected: false,
    },
    {
      id: '5',
      name: 'Webhook',
      description: 'Send agent responses to your webhook endpoints',
      icon: '🔗',
      connected: true,
    },
    {
      id: '6',
      name: 'API',
      description: 'Integrate via REST API',
      icon: '🔌',
      connected: true,
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage="integrations" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="p-8">
          <PageHeader
            title="Integrations"
            description="Connect TheChatAgent with your favorite tools and platforms"
          />

          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="bg-card rounded-lg border p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{integration.icon}</div>
                    {integration.connected && (
                      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-success/10 text-success text-xs">
                        <Check className="h-3 w-3" />
                        Connected
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold mb-2">{integration.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {integration.description}
                  </p>
                  {integration.connected ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive">
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 bg-card rounded-lg border p-6">
              <h3 className="font-semibold mb-2">Need a custom integration?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We can help you build a custom integration for your specific needs
              </p>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
