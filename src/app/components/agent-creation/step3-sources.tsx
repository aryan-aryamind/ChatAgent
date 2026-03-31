import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, AlertCircle, Globe } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { useAgentCreation } from '@/contexts/AgentCreationContext'
import { toast } from 'sonner'

export function AgentCreationStep3() {
  const router = useRouter()
  const { state, updateSourceStatus, updateSourceName, updateSourceQAPairs, setStep, clearSources, setTempAgentId } = useAgentCreation()
  const [isProcessing, setIsProcessing] = useState(true)
  const [hasProcessed, setHasProcessed] = useState(false)
  const [processingSources, setProcessingSources] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Prevent multiple runs - only process once
    if (hasProcessed || state.sources.length === 0) {
      return
    }

    // Check if all sources are already completed
    const allCompleted = state.sources.every(s => s.status === 'completed' || s.status === 'error')
    if (allCompleted && state.sources.length > 0) {
      setIsProcessing(false)
      setHasProcessed(true)
      return
    }

    // Process sources - scrape URLs and generate data
    const processSources = async () => {
      setIsProcessing(true)
      setHasProcessed(true)

      // Process each source that hasn't been processed yet
      for (const source of state.sources) {
        // Skip if already completed, error, or currently processing
        if (source.status === 'completed' || source.status === 'error' || processingSources.has(source.id)) {
          continue
        }

        try {
          // Mark as processing
          setProcessingSources(prev => new Set(prev).add(source.id))
          updateSourceStatus(source.id, 'processing')

          // If it's a link source, scrape it
          if (source.type === 'link' && source.url) {
            try {
              console.log(`🚀 Starting Async Scrape for: ${source.url}`)
              
              // 1. Initial request to START the scrape
              const response = await fetch(`/api/agents/new/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: source.url,
                  options: { maxPairs: 30, minAnswerLength: 20 }
                }),
              })

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                if (response.status === 503 || errorData.code === 'SERVICE_OFFLINE') {
                   toast.error('AI service is busy. Still working in background, please wait...', { duration: 5000 });
                }
                throw new Error(errorData.error || 'Failed to start scraping');
              }

              const startData = await response.json()
              console.log(`✅ Scrape started. Task ID: ${startData.taskId}`)

              if (startData.tempAgentId) {
                setTempAgentId(startData.tempAgentId)
              }

              // 2. POLLING LOOP: Wait for completion
              let isDone = false
              let attempts = 0
              const maxAttempts = 120 // 10 minutes total (120 * 5s)

              while (!isDone && attempts < maxAttempts) {
                attempts++
                // Wait 5 seconds between polls
                await new Promise(resolve => setTimeout(resolve, 5000))
                
                try {
                  const pollRes = await fetch(`/api/agents/new/scrape?taskId=${startData.taskId}`)
                  if (!pollRes.ok) continue // Try again on network glitch

                  const task = await pollRes.json()
                  console.log(`Status poll for ${source.url}: ${task.status}`)

                  if (task.status === 'completed' && task.data?.transformed) {
                    const data = task.data.transformed
                    
                    // Update source name
                    if (data.title) {
                      const genericTitles = ["Scraped Website", "Untitled", "None", "Website"];
                      if (!genericTitles.includes(data.title)) {
                        updateSourceName(source.id, data.title);
                      }
                    }

                    // Update Q&A Pairs
                    if (data.qaPairs && data.qaPairs.length > 0) {
                      updateSourceQAPairs(source.id, data.qaPairs)
                    }

                    updateSourceStatus(source.id, 'completed')
                    isDone = true
                  } else if (task.status === 'error') {
                    console.error('Async scrape failed:', task.error)
                    updateSourceStatus(source.id, 'error')
                    isDone = true
                  }
                } catch (pollErr) {
                  console.warn('Polling glitch:', pollErr)
                  // Keep trying...
                }
              }

              if (!isDone) {
                console.error('Scraping timed out after 10 minutes')
                updateSourceStatus(source.id, 'error')
              }

            } catch (error: any) {
              console.error('Error in scraping process:', error)
              updateSourceStatus(source.id, 'error')
            } finally {
              setProcessingSources(prev => {
                const next = new Set(prev)
                next.delete(source.id)
                return next
              })
            }
          } else if (source.type === 'file' && source.file) {
            // If it's a file source, upload and process it
            try {
              console.log(`Uploading and processing file: ${source.name}`)
              const formData = new FormData()
              formData.append('file', source.file)
              formData.append('persona_type', state.details?.useCase || 'general')

              const response = await fetch(`/api/agents/new/upload`, {
                method: 'POST',
                body: formData,
              })

              if (response.ok) {
                const data = await response.json()
                // Update source with backend title if it's not generic
                if (data.data?.title) {
                  const backendTitle = data.data.title;
                  const genericTitles = ["Untitled document", "Untitled", "None", "PDF", "Document"];
                  if (!genericTitles.includes(backendTitle)) {
                    console.log(`Updating source name from "${source.name}" to "${backendTitle}"`);
                    updateSourceName(source.id, backendTitle);
                  }
                }

                // Save temp agent ID if available
                if (data.data?.tempAgentId) {
                  setTempAgentId(data.data.tempAgentId)
                }

                // Update source with generated data (if any)
                if (data.data?.qaPairs && data.data.qaPairs.length > 0) {
                  updateSourceQAPairs(source.id, data.data.qaPairs)
                }
                
                updateSourceStatus(source.id, 'completed')
              } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                console.error('File processing failed:', errorData)
                
                if (response.status === 503 || errorData.code === 'SERVICE_OFFLINE') {
                  toast.error('Model is not working, please contact the team. Server is down currently or please try again later.', { duration: 10000 });
                } else {
                  toast.error(errorData.message || 'File processing failed');
                }

                updateSourceStatus(source.id, 'error')
              }
            } catch (error: any) {
              console.error('Error processing file:', error)
              updateSourceStatus(source.id, 'error')
            } finally {
              setProcessingSources(prev => {
                const next = new Set(prev)
                next.delete(source.id)
                return next
              })
            }
          } else {
            // For non-link sources, just mark as completed
            await new Promise((resolve) => setTimeout(resolve, 1000))
            updateSourceStatus(source.id, 'completed')
            setProcessingSources(prev => {
              const next = new Set(prev)
              next.delete(source.id)
              return next
            })
          }
        } catch (error) {
          console.error('Error processing source:', error)
          updateSourceStatus(source.id, 'error')
          setProcessingSources(prev => {
            const next = new Set(prev)
            next.delete(source.id)
            return next
          })
        }
      }

      setIsProcessing(false)
    }

    processSources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sources.length]) // Re-run if sources length changes (helps if context is slow to hydrate)

  const handleContinue = () => {
    setStep(3)
    router.push('/agents/new/model')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
    }
  }

  const completedCount = state.sources.filter((s) => s.status === 'completed').length
  const allCompleted = completedCount === state.sources.length && state.sources.length > 0

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Processing your sources</h1>
          <p className="text-muted-foreground text-lg">
            We're fetching and processing data from your sources. This may take a few moments.
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6 mb-6">
          <div className="space-y-4">
            {state.sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(source.status)}
                  <div className="flex-1">
                    <p className="font-medium">{source.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {source.status === 'completed'
                        ? source.type === 'link'
                          ? 'Scraped successfully'
                          : 'Data fetched successfully'
                        : source.status === 'processing'
                          ? 'Scraping website and getting data...'
                          : source.status === 'error'
                            ? 'Model is not working, server is down currently. Please contact support.'
                            : 'Pending...'}
                    </p>
                  </div>
                </div>
                {source.size && (
                  <span className="text-sm text-muted-foreground">{source.size}</span>
                )}
              </div>
            ))}
          </div>

          {state.sources.length === 0 && (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No sources to process</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => {
              // Now goes back to index (Step 1)
              setStep(1)
              router.push('/agents/new')
            }}
          >
            Back to Setup
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!allCompleted}
            size="lg"
          >
            Continue to Model Selection
          </Button>
        </div>
      </div>
    </div>
  )
}
