import { useRouter } from 'next/router'
import { useState } from 'react'
import { Globe, ArrowRight } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { useAgentCreation } from '@/contexts/AgentCreationContext'

export function AgentCreationStep1() {
  const router = useRouter()
  const { setDetails, setStep, addSource, setAgentId } = useAgentCreation()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [useCase, setUseCase] = useState('general')
  const [isLoading, setIsLoading] = useState(false)

  const handleContinue = async () => {
    if (!websiteUrl) return

    // Generate permanent agent ID immediately
    const permanentId = Date.now().toString()
    setAgentId(permanentId)

    setIsLoading(true)

    // Normalize URL
    const normalizedUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`

    // Save details to context
    setDetails({
      name: '', // Will be set later
      websiteUrl: normalizedUrl,
      useCase,
    })

    // Create a source from the URL and add it to context
    // This allows us to skip Step 2 and go directly to Step 3
    const urlSource = {
      id: `source-${Date.now()}`,
      type: 'link' as const,
      name: normalizedUrl,
      url: normalizedUrl,
      status: 'pending' as const,
    }

    addSource(urlSource)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    setIsLoading(false)
    // Skip Step 2 and go directly to Step 3 (sources processing)
    setStep(3)
    router.push('/agents/new/sources')
  }

  const handleManualSetup = () => {
    // Generate permanent agent ID immediately
    const permanentId = Date.now().toString()
    setAgentId(permanentId)

    // Clear any sources if user wants manual setup
    // This allows them to go to Step 2 and add sources manually
    setStep(2)
    router.push('/agents/new/details')
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Let's start with a link</h1>
          <p className="text-muted-foreground text-lg">
            Share your website link, and we'll automatically build an AI agent trained on your content.
          </p>
        </div>

        <div className="bg-card rounded-lg border p-8 mb-6">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Your website URL</label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Use-case</label>
              <Select value={useCase} onValueChange={setUseCase}>
                <SelectTrigger>
                  <SelectValue>General AI agent</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General AI agent</SelectItem>
                  <SelectItem value="support">Customer Support</SelectItem>
                  <SelectItem value="sales">Sales Assistant</SelectItem>
                  <SelectItem value="faq">FAQ Bot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleContinue}
              disabled={!websiteUrl || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Processing...' : 'Continue'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">OR</span>
            </div>
          </div>

          <Button
            onClick={handleManualSetup}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Set up manually with other sources
          </Button>
        </div>

        {/* Visual illustration */}
        <div className="relative h-64 bg-muted/30 rounded-lg border-2 border-dashed border-primary/20 flex items-center justify-center">
          <div className="text-center">
            <Globe className="h-16 w-16 mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Visual representation of website to agent flow</p>
          </div>
        </div>
      </div>
    </div>
  )
}
