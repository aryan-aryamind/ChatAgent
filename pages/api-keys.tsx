import { useRouter } from 'next/router'
import { Key, Copy, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { PageHeader } from '@/app/components/page-header'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { toast } from 'sonner'

export default function ApiKeysPage() {
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

  const apiKeys = [
    {
      id: '1',
      name: 'Production API Key',
      key: 'cb_live_1234567890abcdef',
      created: '2 days ago',
      lastUsed: '5 minutes ago',
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'cb_test_abcdef1234567890',
      created: '1 week ago',
      lastUsed: '2 hours ago',
    },
  ]

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('API key copied to clipboard')
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage="api-keys" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="p-8">
          <PageHeader
            title="API Keys"
            description="Manage your API keys for programmatic access"
            action={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Key
              </Button>
            }
          />

          <div className="mt-8 relative">
            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] rounded-lg flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-primary/20">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Key className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">API Access Coming Soon</h3>
              <p className="text-muted-foreground max-w-md">
                We're currently finalizing our public API. Programmatic access to your agents will be available in the next major update.
              </p>
            </div>

            <div className="space-y-4 opacity-40 select-none grayscale-[0.5]">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="bg-card rounded-lg border p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Key className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{apiKey.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <Input
                          value={apiKey.key}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {apiKey.created}</span>
                        <span>•</span>
                        <span>Last used: {apiKey.lastUsed}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" disabled>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-2">API Documentation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Learn how to integrate Chatbase API into your application
            </p>
            <Button variant="outline">View Documentation</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
