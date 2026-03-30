import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import {
  Key,
  Copy,
  Plus,
  Trash2,
  Loader2,
  Check,
  Clock,
  Activity,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { PageHeader } from '@/app/components/page-header'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/app/components/ui/select'
import { toast } from 'sonner'
import { useAgents } from '@/contexts/AgentsContext'

interface ApiKey {
  id: string
  name: string
  key?: string
  agentName: string
  agentId: string
  usageCount: number
  status: 'active' | 'disabled'
  lastUsed: string | null
  createdAt: string
}

export default function ApiKeysPage() {
  const router = useRouter()
  const { agents, isLoaded } = useAgents()
  const loadingAgents = !isLoaded
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Create Key Form State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  useEffect(() => {
    fetchKeys()

    // Auto-update request quota by polling every 5 seconds
    const interval = setInterval(() => {
      fetchKeys(false)
    }, 5000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchKeys = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    try {
      const res = await fetch('/api/keys/list')
      if (res.ok) {
        const data = await res.json()
        setKeys(data)
      }
    } catch (error) {
      if (showLoading) toast.error('Failed to load API keys')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyName || !selectedAgentId) {
      toast.error('Please provide a name and select an agent')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/keys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, agentId: selectedAgentId })
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedKey(data.key)
        toast.success('API key generated successfully')
        fetchKeys()
      } else {
        toast.error('Failed to create API key')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return

    try {
      const res = await fetch('/api/keys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (res.ok) {
        setKeys(keys.filter(k => k.id !== id))
        toast.success('API key revoked')
      } else {
        toast.error('Failed to revoke key')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('API key copied to clipboard')
  }

  const handleNavigate = (page: string) => {
    router.push(page === 'dashboard' ? '/dashboard' : `/${page}`)
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        currentPage="api-keys"
        onNavigate={handleNavigate}
      />

      <main className="flex-1 ml-60 overflow-y-auto font-geist">
        <div className="p-8 max-w-6xl mx-auto">
          <PageHeader
            title="API Access"
            description="Secure programmatic access to your AI agents via high-performance API keys"
            action={
              <Button className="gap-2 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90" onClick={() => {
                setGeneratedKey(null)
                setNewKeyName('')
                setShowCreateModal(true)
              }}>
                <Plus className="h-4 w-4" />
                New Secret Key
              </Button>
            }
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-80 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
              <p className="text-sm text-muted-foreground animate-pulse">Fetching your secure keys...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="mt-12 bg-card/30 backdrop-blur-sm rounded-2xl border-2 border-dashed border-primary/20 p-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-primary/10 p-5 rounded-3xl w-fit mx-auto mb-6">
                <Key className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Initialize Your Platform</h3>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
                Unlock the full power of your AI agents by generating your first API key for production integration.
              </p>
              <Button size="lg" className="rounded-xl px-8" onClick={() => setShowCreateModal(true)}>
                Generate Primary Key
              </Button>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6">
              {keys.map((apiKey) => (
                <div key={apiKey.id} className="group bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
                          <Key className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{apiKey.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Activity className="h-3 w-3" />
                            <span>Scoped to: <span className="text-foreground font-semibold">{apiKey.agentName}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-6">
                        <div className="relative flex-1 max-w-lg">
                          <Input
                            value="sk_••••••••••••••••••••••••••••••••"
                            readOnly
                            className="font-mono text-sm bg-muted/30 border-muted-foreground/10 h-10 tracking-widest"
                          />
                        </div>
                        <div className="flex flex-col text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                          </span>
                          {apiKey.lastUsed && (
                            <span className="text-primary/70 mt-1 flex items-center gap-1.5">
                              <Activity className="h-3 w-3" />
                              Used: {new Date(apiKey.lastUsed).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quota Tracker */}
                      <div className="flex flex-col md:flex-row md:items-center gap-6 py-5 px-6 bg-muted/40 rounded-2xl border border-border/40 shadow-inner">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <Activity className="h-3.5 w-3.5" />
                              Request Quota
                            </span>
                            <span className={apiKey.usageCount >= 900 ? 'text-destructive font-black' : 'text-primary font-black'}>
                              {apiKey.usageCount} / 1,000
                            </span>
                          </div>
                          <div className="h-2.5 w-full bg-background/50 rounded-full overflow-hidden border border-border/20 p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.4)] ${apiKey.usageCount >= 900 ? 'bg-destructive' : 'bg-gradient-to-r from-primary via-indigo-400 to-indigo-300'}`}
                              style={{ width: `${Math.max(apiKey.usageCount > 0 ? 1 : 0, Math.min((apiKey.usageCount / 1000) * 100, 100))}%` }}
                            />
                          </div>
                        </div>

                        <div className="h-12 w-px bg-border/40 hidden md:block" />

                        <div className="w-full md:w-60">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-2 px-1">Trial Lifecycle</p>
                          <div className="flex items-center justify-between bg-background/30 p-2.5 rounded-xl border border-border/20">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${apiKey.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                              {apiKey.status}
                            </span>
                            <div className="flex flex-col text-right">
                              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">Ends</span>
                              <span className="text-[11px] font-bold text-foreground">
                                {new Date(new Date(apiKey.createdAt).setDate(new Date(apiKey.createdAt).getDate() + 3)).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                      onClick={() => handleRevokeKey(apiKey.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Key Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
              <div className="w-full max-w-md bg-card/95 backdrop-blur-2xl rounded-[2rem] border border-primary/20 shadow-[0_0_80px_-15px_rgba(99,102,241,0.3)] p-10 transform animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                {!generatedKey ? (
                  <div className="relative z-10">
                    <h3 className="text-3xl font-black mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">New API Vault</h3>
                    <p className="text-muted-foreground text-sm mb-10 leading-relaxed font-medium">Issue a secure primitive key for production API access.</p>

                    <div className="space-y-8">
                      <div>
                        <label className="text-[10px] font-black mb-3 block text-muted-foreground tracking-[0.2em] uppercase">
                          Display Label
                        </label>
                        <Input
                          placeholder="e.g. Production Environment"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="h-12 bg-background/40 border-primary/20 focus:ring-primary/20 focus:border-primary/50 transition-all rounded-xl placeholder:text-muted-foreground/30"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black mb-3 block text-muted-foreground tracking-[0.2em] uppercase">
                          Target Agent Scope
                        </label>
                        <Select
                          value={selectedAgentId}
                          onValueChange={setSelectedAgentId}
                        >
                          <SelectTrigger className="w-full h-12 bg-background/40 border-primary/20 focus:ring-primary/20 rounded-xl">
                            <SelectValue placeholder="Select high-performance agent..." />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-primary/30 backdrop-blur-2xl rounded-xl">
                            {agents.map(a => (
                              <SelectItem key={a.id} value={a.id} className="cursor-pointer py-3 hover:bg-primary/10 rounded-lg">
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button
                          variant="ghost"
                          className="flex-1 h-12 text-muted-foreground hover:bg-muted/30 rounded-xl"
                          onClick={() => setShowCreateModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-2 h-12 shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 rounded-xl font-bold"
                          onClick={handleCreateKey}
                          disabled={isCreating}
                        >
                          {isCreating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
                          Issue Token
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center relative z-10">
                    <div className="bg-green-500/10 p-6 rounded-[2rem] w-fit mx-auto mb-8 shadow-inner border border-green-500/20">
                      <Check className="h-12 w-12 text-green-500" />
                    </div>
                    <h3 className="text-3xl font-black mb-3 tracking-tight">Security Token Issued</h3>
                    <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                      Copy your new secret key now. For your protection, <br />
                      <span className="text-destructive font-black underline underline-offset-4 decoration-2">this token won't be shown again.</span>
                    </p>

                    <div className="relative mb-10">
                      <Input
                        value={generatedKey}
                        readOnly
                        className="font-mono text-[11px] pr-14 bg-green-500/5 border-green-500/30 h-14 rounded-2xl tracking-widest text-green-500"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1 h-12 w-12 hover:bg-green-500/10 rounded-xl"
                        onClick={() => handleCopy(generatedKey)}
                      >
                        <Copy className="h-5 w-5 text-green-500" />
                      </Button>
                    </div>

                    <Button size="lg" className="w-full h-14 rounded-2xl font-black bg-green-600 hover:bg-green-700 shadow-xl shadow-green-900/20" onClick={() => setShowCreateModal(false)}>
                      Verified & Copied
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Docs Footer */}
          <div className="mt-16 bg-gradient-to-br from-card/80 to-primary/10 rounded-[2.5rem] border border-primary/20 p-10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-700" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl text-center md:text-left">
                <h3 className="text-3xl font-black mb-4 flex items-center md:justify-start justify-center gap-3">
                  <div className="p-3 bg-primary/20 rounded-2xl">
                    <AlertCircle className="h-6 w-6 text-primary" />
                  </div>
                  API Integration Guide
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-8 font-medium italic">
                  Seamlessly connect your specialized AI agents to any enterprise application, custom CRM, or mobile experience using our high-performance REST endpoints.
                </p>
                <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
                  <div className="px-4 py-2 bg-background/50 rounded-xl border border-border/40 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest">v1 Endpoint Active</span>
                  </div>
                  <div className="px-4 py-2 bg-background/50 rounded-xl border border-border/40 flex items-center gap-2">
                    <Activity className="h-3 w-3 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Low Latency</span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col gap-4 min-w-[320px]">
                <div className="p-6 bg-black/40 backdrop-blur-xl rounded-[1.5rem] border border-primary/20 font-mono text-xs text-indigo-300 shadow-2xl relative">
                  <div className="absolute top-3 right-4 text-[10px] text-muted-foreground font-bold">BASH</div>
                  <span className="text-green-400">$</span> curl -X POST https://thechatagent.com/api/v1/chat \<br />
                  &nbsp;&nbsp;-H <span className="text-white">"x-api-key: YOUR_KEY"</span> \<br />
                  &nbsp;&nbsp;-d <span className="text-indigo-400">'&#123;"message": "Hello!"&#125;'</span>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-primary/30 hover:bg-primary/10 gap-2 font-black group transition-all"
                  onClick={() => router.push('/docs/api-v1')}
                >
                  Explore Documentation
                  <ExternalLink className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
