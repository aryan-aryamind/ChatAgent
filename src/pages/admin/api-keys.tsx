import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { 
  Key, 
  Search, 
  Trash2, 
  Power, 
  PowerOff, 
  User, 
  Bot, 
  BarChart3, 
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { PageHeader } from '@/app/components/page-header'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { toast } from 'sonner'

interface AdminApiKey {
  id: string
  name: string
  userEmail: string
  userName: string
  userPlan: string
  agentName: string
  agentId: string
  usageCount: number
  status: 'active' | 'disabled'
  lastUsed: string | null
  createdAt: string
}

export default function AdminApiKeysPage() {
  const router = useRouter()
  const [keys, setKeys] = useState<AdminApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchKeys()
    
    // Auto-update request quota by polling every 5 seconds
    const interval = setInterval(() => {
      fetchKeys(false)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const fetchKeys = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    try {
      const res = await fetch('/api/admin/keys/list')
      if (res.ok) {
        const data = await res.json()
        setKeys(data)
      } else {
        if (showLoading) toast.error('Failed to load admin keys')
      }
    } catch (error) {
      if (showLoading) toast.error('An error occurred loading keys')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active'
    try {
      const res = await fetch('/api/admin/keys/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_STATUS', id, status: newStatus })
      })

      if (res.ok) {
        setKeys(keys.map(k => k.id === id ? { ...k, status: newStatus as any } : k))
        toast.success(`Key ${newStatus === 'active' ? 'activated' : 'disabled'}`)
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this key? This cannot be undone.')) return

    try {
      const res = await fetch('/api/admin/keys/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', id })
      })

      if (res.ok) {
        setKeys(keys.filter(k => k.id !== id))
        toast.success('Key permanently deleted')
      } else {
        toast.error('Failed to delete key')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const filteredKeys = keys.filter(k => 
    k.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.agentName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleNavigate = (page: string) => {
    router.push(page === 'dashboard' ? '/dashboard' : `/${page}`)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage="admin-keys" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="p-8">
          <PageHeader
            title="Global API Key Management"
            description="Access control and monitoring for all user API keys across the entire platform"
          />

          <div className="mt-8 mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by user email, agent or key name..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading platform keys...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="bg-card rounded-xl border p-12 text-center">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold">No API Keys Generated</h3>
              <p className="text-muted-foreground">No users have generated API keys yet.</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b">
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Key & Owner</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Linked Agent</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground text-center">Usage</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground">Plan & Expiry</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground text-center">Status</th>
                      <th className="px-6 py-4 font-semibold text-muted-foreground text-right tracking-tight">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-muted/10 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground mb-0.5">{key.name}</span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {key.userEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-primary" />
                            <span className="font-medium">{key.agentName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col items-center">
                              <span className={`text-sm font-mono ${key.usageCount >= 900 ? 'text-destructive font-bold' : 'text-foreground'}`}>
                                {key.usageCount}
                              </span>
                              <div className="w-24 h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${key.usageCount >= 900 ? 'bg-destructive' : 'bg-primary'}`}
                                  style={{ width: `${Math.max(key.usageCount > 0 ? 1 : 0, Math.min((key.usageCount / 1000) * 100, 100))}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-1 uppercase">of 1,000 requests</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] ${key.userPlan === 'FREE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                                {key.userPlan}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Expires: {new Date(new Date(key.createdAt).setDate(new Date(key.createdAt).getDate() + 3)).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${key.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                            {key.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              title={key.status === 'active' ? 'Stop (Disable) Key' : 'Activate (Start) Key'}
                              className={key.status === 'active' ? 'text-amber-500 hover:bg-amber-500/10' : 'text-green-500 hover:bg-green-500/10'}
                              onClick={() => handleToggleStatus(key.id, key.status)}
                            >
                              {key.status === 'active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              title="Revoke Key Permanently"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteKey(key.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8 bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 flex gap-4">
             <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
             <div>
                <h4 className="font-bold text-amber-500 mb-1 leading-none">Admin Policy Reminder</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  As the platform administrator, disabling a key instantly blocks all active integrations. Use this for abuse protection or trial expirations. Trial keys automatically expire and show a 403 error on the client side after 3 days.
                </p>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}
