import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { File, FileText, Link as LinkIcon, MessageSquare, BookOpen, Plus, Pencil, Check, X, Trash2, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog'
import { Label } from '@/app/components/ui/label'
import { useAgentCreation } from '@/contexts/AgentCreationContext'
import { Source, QAPair } from '@/contexts/AgentCreationContext'

export function AgentCreationStep2() {
  const router = useRouter()
  const { state, addSource, setStep } = useAgentCreation()
  const [openDialogType, setOpenDialogType] = useState<Source['type'] | null>(null)
  const [dialogKey, setDialogKey] = useState(0) // Key to force dialog remount
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [qaPairs, setQAPairs] = useState<QAPair[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentAnswer, setCurrentAnswer] = useState('')

  const sourceTypes = [
    { type: 'file' as const, icon: File, label: 'File' },
    { type: 'text' as const, icon: FileText, label: 'Text' },
    { type: 'link' as const, icon: LinkIcon, label: 'Links' },
    { type: 'qa' as const, icon: MessageSquare, label: 'Q&A' },
    { type: 'notion' as const, icon: BookOpen, label: 'Notion' },
  ]

  const handleAddQAPair = () => {
    if (!currentQuestion.trim() || !currentAnswer.trim()) return

    const newPair: QAPair = {
      id: Date.now().toString(),
      question: currentQuestion.trim(),
      answer: currentAnswer.trim(),
      intent: generateIntent(currentQuestion.trim()),
    }

    setQAPairs([...qaPairs, newPair])
    setCurrentQuestion('')
    setCurrentAnswer('')
  }

  const handleRemoveQAPair = (id: string) => {
    setQAPairs(qaPairs.filter((pair) => pair.id !== id))
  }

  const generateIntent = (question: string): string => {
    const lower = question.toLowerCase()
    if (lower.includes('hour') || lower.includes('open') || lower.includes('time')) return 'business_hours'
    if (lower.includes('price') || lower.includes('cost') || lower.includes('fee')) return 'pricing'
    if (lower.includes('support') || lower.includes('help')) return 'support'
    if (lower.includes('refund') || lower.includes('return')) return 'refund'
    if (lower.includes('contact') || lower.includes('email') || lower.includes('phone')) return 'contact'
    return 'general'
  }

  const handleSaveQASource = () => {
    if (qaPairs.length === 0) return

    const qaSource: Source = {
      id: Date.now().toString(),
      type: 'qa',
      name: `Q&A (${qaPairs.length} pairs)`,
      size: `${qaPairs.length * 2} KB`,
      status: 'pending',
      qaPairs: qaPairs,
    }

    addSource(qaSource)
    
    // Close dialog FIRST - this is critical
    setOpenDialogType(null)
    
    // Then reset form fields
    setQAPairs([])
    setCurrentQuestion('')
    setCurrentAnswer('')
    
    // Force dialog to remount after a brief delay to ensure it closes
    setTimeout(() => {
      setDialogKey(prev => prev + 1)
    }, 50)
  }

  const handleAddSource = (sourceType: Source['type'], e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!sourceType) return

    // Special handling for Q&A
    if (sourceType === 'qa') {
      setOpenDialogType('qa')
      return
    }

    // Validate inputs
    const trimmedName = sourceName.trim()
    const trimmedUrl = sourceUrl.trim()
    
    if (!trimmedName) {
      return
    }
    
    if (sourceType === 'link' && !trimmedUrl) {
      return
    }

    // Create the source
    const newSource: Source = {
      id: Date.now().toString(),
      type: sourceType,
      name: trimmedName || `${sourceType} source`,
      url: sourceType === 'link' ? trimmedUrl : undefined,
      size: sourceType === 'file' ? '10 KB' : undefined,
      status: 'pending',
    }

    // Add source to context
    addSource(newSource)
    
    // Close dialog FIRST - this is critical
    setOpenDialogType(null)
    
    // Then reset form fields
    setSourceUrl('')
    setSourceName('')
    
    // Force dialog to remount after a brief delay to ensure it closes
    setTimeout(() => {
      setDialogKey(prev => prev + 1)
    }, 50)
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!openDialogType) {
      setSourceUrl('')
      setSourceName('')
    }
  }, [openDialogType])

  const handleBack = () => {
    setStep(1)
    router.push('/agents/new')
  }

  const handleContinue = () => {
    setStep(3)
    router.push('/agents/new/sources')
  }

  const getSourceIcon = (type: Source['type']) => {
    const sourceType = sourceTypes.find((s) => s.type === type)
    return sourceType ? sourceType.icon : File
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Add training sources</h1>
          <p className="text-muted-foreground text-lg">
            You can add multiple sources to train your Agent, let's start with a file or a link to your site.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main sources list */}
          <div className="lg:col-span-2 bg-card rounded-lg border p-6">
            <div className="space-y-4">
              {sourceTypes.map((source) => {
                const existingSource = state.sources.find((s) => s.type === source.type)
                const Icon = source.icon

                return (
                  <div
                    key={source.type}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {existingSource
                            ? `${state.sources.filter((s) => s.type === source.type).length} ${source.label}`
                            : source.label}
                        </span>
                        {source.type === 'qa' && existingSource && (
                          <span className="text-xs text-muted-foreground">
                            {existingSource.qaPairs?.length || 0} pairs
                          </span>
                        )}
                      </div>
                      {existingSource && (
                        <Check className="h-4 w-4 text-green-500 ml-2" />
                      )}
                    </div>
                    <Dialog 
                      key={`dialog-${source.type}-${dialogKey}`}
                      open={openDialogType === source.type} 
                      onOpenChange={(open) => {
                        // Handle both manual and programmatic close
                        if (!open) {
                          // Dialog is closing - reset state
                          setOpenDialogType(null)
                          setSourceUrl('')
                          setSourceName('')
                          if (source.type === 'qa') {
                            setQAPairs([])
                            setCurrentQuestion('')
                            setCurrentAnswer('')
                          }
                        } else if (open && openDialogType !== source.type) {
                          // Dialog is opening
                          setOpenDialogType(source.type)
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenDialogType(source.type)}
                        >
                          {existingSource ? (
                            <Pencil className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {source.type === 'qa' ? 'Add Q&A Pairs' : `Add ${source.label}`}
                          </DialogTitle>
                        </DialogHeader>
                        {source.type === 'qa' ? (
                          <div className="space-y-4 mt-4">
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <p className="text-sm text-muted-foreground mb-4">
                                Add question and answer pairs. These will be used for intent-based responses in CrewAI mode.
                              </p>
                              <div className="space-y-3">
                                <div>
                                  <Label>Question</Label>
                                  <Input
                                    value={currentQuestion}
                                    onChange={(e) => setCurrentQuestion(e.target.value)}
                                    placeholder="e.g., What are your business hours?"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.shiftKey === false && currentQuestion.trim() && currentAnswer.trim()) {
                                        e.preventDefault()
                                        handleAddQAPair()
                                      }
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Answer</Label>
                                  <Textarea
                                    value={currentAnswer}
                                    onChange={(e) => setCurrentAnswer(e.target.value)}
                                    placeholder="e.g., We're open Monday-Friday, 9 AM to 6 PM EST"
                                    rows={3}
                                  />
                                </div>
                                <Button
                                  onClick={handleAddQAPair}
                                  disabled={!currentQuestion.trim() || !currentAnswer.trim()}
                                  className="w-full"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Q&A Pair
                                </Button>
                              </div>
                            </div>

                            {qaPairs.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label>Added Pairs ({qaPairs.length})</Label>
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {qaPairs.map((pair) => (
                                    <div
                                      key={pair.id}
                                      className="bg-card border rounded-lg p-3 space-y-2"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">Q: {pair.question}</p>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            A: {pair.answer}
                                          </p>
                                          {pair.intent && (
                                            <span className="text-xs text-primary mt-1 inline-block">
                                              Intent: {pair.intent}
                                            </span>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleRemoveQAPair(pair.id)}
                                          className="h-8 w-8"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 pt-4 border-t">
                              <Button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleSaveQASource()
                                }}
                                disabled={qaPairs.length === 0}
                                className="flex-1"
                                type="button"
                              >
                                Save Q&A Source ({qaPairs.length} pairs)
                              </Button>
                              <Button
                                variant="outline"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setOpenDialogType(null)
                                  setQAPairs([])
                                  setCurrentQuestion('')
                                  setCurrentAnswer('')
                                  setTimeout(() => {
                                    setDialogKey(prev => prev + 1)
                                  }, 50)
                                }}
                                type="button"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label htmlFor={`source-name-${source.type}`}>Name</Label>
                              <Input
                                id={`source-name-${source.type}`}
                                value={sourceName}
                                onChange={(e) => setSourceName(e.target.value)}
                                placeholder={`Enter ${source.label.toLowerCase()} name`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && sourceName.trim() && (source.type !== 'link' || sourceUrl)) {
                                    handleAddSource(source.type)
                                  }
                                }}
                              />
                            </div>
                            {source.type === 'link' && (
                              <div>
                                <Label htmlFor={`source-url-${source.type}`}>URL</Label>
                                <Input
                                  id={`source-url-${source.type}`}
                                  value={sourceUrl}
                                  onChange={(e) => setSourceUrl(e.target.value)}
                                  placeholder="https://example.com"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && sourceName.trim() && sourceUrl) {
                                      handleAddSource(source.type)
                                    }
                                  }}
                                />
                              </div>
                            )}
                            <Button 
                              onClick={(e) => handleAddSource(source.type, e)} 
                              className="w-full"
                              disabled={
                                (source.type === 'link' && !sourceUrl.trim()) || 
                                !sourceName.trim()
                              }
                              type="button"
                            >
                              Add {source.label}
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                )
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleContinue}
                className="flex items-center gap-2"
                size="lg"
                disabled={state.sources.length === 0}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sources summary */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Sources</h3>
            <div className="space-y-4">
              {state.sources.length > 0 ? (
                <>
                  {state.sources.map((source) => {
                    const Icon = getSourceIcon(source.type)
                    return (
                      <div key={source.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{source.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">TBD</span>
                      </div>
                    )
                  })}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total size</span>
                      <span>{state.totalSize} / 400 KB</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No sources added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
