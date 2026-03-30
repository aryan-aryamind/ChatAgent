import { useRouter } from 'next/router'
import { useRef, useState, useEffect } from 'react'
import { Globe, ArrowRight, File, Plus, Pencil, Check, X, Trash2, Upload, MessageSquare } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Label } from '@/app/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog'
import { useAgentCreation } from '@/contexts/AgentCreationContext'
import { Source } from '@/contexts/AgentCreationContext'
import { toast } from 'sonner'

export function AgentCreationStep1() {
  const router = useRouter()
  const { state, setDetails, setStep, addSource, removeSource, setAgentId, clearSources } = useAgentCreation()
  const [websiteUrl, setWebsiteUrl] = useState(state.details?.websiteUrl || '')
  const [useCase, setUseCase] = useState(state.details?.useCase || 'general')
  const [isLoading, setIsLoading] = useState(false)

  // Source management state from Step 2
  const [openDialogType, setOpenDialogType] = useState<Source['type'] | null>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const [sourceName, setSourceName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!sourceName) {
        setSourceName(file.name)
      }
    }
  }

  const handleAddSource = (sourceType: Source['type'], e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!sourceType) return

    const trimmedName = sourceName.trim()
    if (!trimmedName && sourceType === 'file') return

    const newSource: Source = {
      id: Date.now().toString(),
      type: sourceType,
      name: trimmedName || (sourceType === 'file' && selectedFile ? selectedFile.name : `${sourceType} source`),
      size: sourceType === 'file' && selectedFile ? formatFileSize(selectedFile.size) : undefined,
      file: sourceType === 'file' && selectedFile ? selectedFile : undefined,
      status: 'pending',
    }

    addSource(newSource)
    setOpenDialogType(null)
    setSourceName('')
    setSelectedFile(null)
    setTimeout(() => setDialogKey(prev => prev + 1), 50)
  }

  const handleContinue = async () => {
    // 1. Validate if we have at least one source (URL or File)
    if (!websiteUrl && state.sources.length === 0) {
      toast.error('Please provide a website URL or upload a file.')
      return
    }

    setIsLoading(true)

    // 2. Clear sources if starting fresh (optional logic, but here we preserve what's added)
    // Actually, if they provided a websiteUrl, we should add it as a source if it's not already there
    if (websiteUrl) {
      const normalizedUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`

      // Only add if not already present in state.sources
      const urlExists = state.sources.find(s => s.type === 'link' && s.url === normalizedUrl)
      if (!urlExists) {
        const urlSource: Source = {
          id: `source-url-${Date.now()}`,
          type: 'link',
          name: normalizedUrl,
          url: normalizedUrl,
          status: 'pending',
        }
        addSource(urlSource)
      }

      setDetails({
        name: '',
        websiteUrl: normalizedUrl,
        useCase,
      })
    } else {
      setDetails({
        name: '',
        websiteUrl: '',
        useCase,
      })
    }

    // Generate permanent agent ID if not present
    if (!state.agentId) {
      setAgentId(Date.now().toString())
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    setIsLoading(false)
    setStep(2) // Going to Processing (Step 2)
    router.push('/agents/new/sources')
  }

  const [activeTab, setActiveTab] = useState<'link' | 'files'>('link')

  return (
    <div className="h-full overflow-y-auto bg-background pb-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Agent Knowledge Base
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Train your AI agent with the most relevant information.
          </p>
        </div>

        {/* Source Selection Tabs */}
        <div className="flex justify-center mb-10 p-1.5 bg-secondary/30 rounded-2xl w-fit mx-auto border border-border/50">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'link'
              ? 'bg-card text-primary shadow-lg scale-100 border border-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 scale-95'
              }`}
          >
            <Globe className="h-4 w-4" />
            Website Link
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'files'
              ? 'bg-card text-primary shadow-lg scale-100 border border-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 scale-95'
              }`}
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </button>
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Main Input Area */}
          <div className="bg-card rounded-3xl border border-border shadow-2xl overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="space-y-10">
                {/* Global Role Selection */}
                <div className="space-y-4 pb-8 border-b border-border/50">
                  <label className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] px-1">What's the agent's main role?</label>
                  <Select value={useCase} onValueChange={setUseCase}>
                    <SelectTrigger className="h-14 text-lg font-semibold bg-secondary/10 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="general" className="py-3">General AI Specialist</SelectItem>
                      <SelectItem value="support" className="py-3">Customer Support Hero</SelectItem>
                      <SelectItem value="sales" className="py-3">Sales & Growth Assistant</SelectItem>
                      <SelectItem value="faq" className="py-3">Knowledge Base Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {activeTab === 'link' ? (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-2xl font-bold">Import from Website</h2>
                      <p className="text-muted-foreground text-sm">We'll automatically extract knowledge from this URL and its subpages.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Globe className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && websiteUrl.trim() && handleContinue()}
                          placeholder="https://example.com"
                          className="h-16 pl-12 text-lg bg-secondary/10 border-border/50 focus:border-primary/50 transition-all rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-2xl font-bold">Upload Custom Documents</h2>
                      <p className="text-muted-foreground text-sm">Feed your agent special documents that aren't available on your website.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div
                        onClick={() => !selectedFile && fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all group relative overflow-hidden min-h-[220px] ${selectedFile
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border cursor-pointer hover:bg-primary/5 hover:border-primary/40'
                          }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.txt"
                        />

                        {selectedFile ? (
                          <div className="flex flex-col items-center justify-center w-full animate-in zoom-in-95 duration-300">
                            <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
                              <File className="h-8 w-8" />
                            </div>
                            <p className="text-base font-bold text-center truncate max-w-[200px] mb-1">{selectedFile.name}</p>
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-6">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready</p>

                            <div className="flex gap-3 w-full max-w-[240px]">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="flex-1 h-10 font-bold rounded-lg border-border/50"
                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 h-10 font-bold rounded-lg shadow-lg shadow-primary/20"
                                onClick={(e) => { e.stopPropagation(); handleAddSource('file'); }}
                              >
                                Add knowledge
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <Plus className="h-7 w-7 text-primary" />
                            </div>
                            <p className="text-lg font-bold">Drop PDF or DOCX</p>
                            <p className="text-xs text-muted-foreground mt-1">Files up to 10MB each</p>
                          </>
                        )}
                      </div>

                      <div className="p-10 border rounded-2xl bg-secondary/10 flex flex-col items-center justify-center relative cursor-not-allowed group text-center">
                        <div className="h-14 w-14 rounded-full bg-muted/20 flex items-center justify-center mb-4 text-muted-foreground opacity-50">
                          <MessageSquare className="h-7 w-7" />
                        </div>
                        <p className="text-lg font-bold text-muted-foreground opacity-50">Q&A Pairs</p>
                        <span className="absolute top-4 right-4 bg-background/50 text-muted-foreground text-[10px] px-2 py-1 rounded font-black tracking-widest border border-border/50 backdrop-blur-sm">SOON</span>
                      </div>
                    </div>

                    {/* Added Materials Inline List */}
                    {state.sources.length > 0 && (
                      <div className="space-y-3 pt-6 border-t border-border/50">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 px-1">Added Knowledge</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {state.sources.map(source => (
                            <div key={source.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border/50 group hover:border-primary/30 hover:bg-secondary/30 transition-all">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${source.type === 'link' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/20 text-primary'}`}>
                                  {source.type === 'link' ? <Globe className="h-4 w-4" /> : <File className="h-4 w-4" />}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-sm font-bold truncate">{source.name}</p>
                                  <p className="text-[10px] font-black text-muted-foreground/80 uppercase">{source.type} • {source.size || 'Auto'}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full flex-shrink-0"
                                onClick={() => removeSource(source.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="bg-muted/30 border-t border-border/50 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center"><Check className="h-3 w-3 text-green-500" /></div>
                  No coding
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center"><Check className="h-3 w-3 text-green-500" /></div>
                  Auto-scrape
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center"><Check className="h-3 w-3 text-green-500" /></div>
                  Secure
                </div>
              </div>

              <Button
                onClick={handleContinue}
                disabled={isLoading}
                className="w-full md:w-auto px-12 h-14 text-lg font-black rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {isLoading ? 'Processing...' : 'Build Agent Now'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 font-medium">
          Need help? <button className="text-primary hover:underline">Chat with our guide</button>
        </p>
      </div>
    </div>
  )
}
