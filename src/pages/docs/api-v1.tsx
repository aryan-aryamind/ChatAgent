import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { PageHeader } from '@/app/components/page-header'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft, Key, Code, Globe, Terminal, ShieldCheck, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function ApiDocsPage() {
  const router = useRouter()
  const [baseUrl, setBaseUrl] = useState('')
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null)

  // Get current base URL on mount
  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const handleCopy = (text: string, blockId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedBlock(blockId)
    toast.success('Code copied to clipboard')
    setTimeout(() => setCopiedBlock(null), 2000)
  }

  const handleNavigate = (page: string) => {
    router.push(page === 'dashboard' ? '/dashboard' : `/${page}`)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentPage="api-keys"
        onNavigate={handleNavigate}
      />

      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8 lg:p-12">
          <Button
            variant="ghost"
            className="mb-6 -ml-3 gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/api-keys')}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to API Keys
          </Button>

          <PageHeader
            title="API V1 Documentation"
            description="Engineering guide for integrating TheChatAgent into your custom applications"
          />

          <div className="mt-12 space-y-12 pb-24">
            {/* Authentication Section */}
            <section id="authentication">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Authentication</h2>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                All requests to the TheChatAgent API must include your secret API key in the <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-sm text-primary">x-api-key</code> request header.
              </p>
              <div className="bg-muted/30 border rounded-xl p-6 font-mono text-sm group relative">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-3 top-3 transition-opacity h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => handleCopy('x-api-key: sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'header')}
                >
                  {copiedBlock === 'header' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <span className="text-muted-foreground"># Example Header</span><br />
                <span className="text-primary">x-api-key</span>: sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
              </div>
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-200/80 italic">
                <strong>Important:</strong> Keep your API keys secret. Never share them in public repositories or client-side code visible to users.
              </div>
            </section>

            {/* Chat API Section */}
            <section id="chat-api">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Chat API</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                The primary endpoint for interacting with your AI agents programmatically.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold uppercase tracking-wider border border-green-500/30">POST</span>
                  <code className="text-lg font-mono text-foreground">/api/v1/chat</code>
                </div>

                <div className="bg-card border rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b bg-muted/20 font-semibold text-sm">Request Body</div>
                  <div className="p-6 overflow-x-auto text-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left pb-4 font-medium">Parameter</th>
                          <th className="text-left pb-4 font-medium">Type</th>
                          <th className="text-left pb-4 font-medium">Required</th>
                          <th className="text-left pb-4 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="py-4 font-mono text-primary font-bold">message</td>
                          <td className="py-4 font-mono text-muted-foreground">string</td>
                          <td className="py-4 text-green-400">Yes</td>
                          <td className="py-4 text-muted-foreground">The user's input message to the agent.</td>
                        </tr>
                        <tr>
                          <td className="py-4 font-mono text-primary font-bold">history</td>
                          <td className="py-4 font-mono text-muted-foreground">array</td>
                          <td className="py-4">No</td>
                          <td className="py-4 text-muted-foreground">Previous message objects for context. Format: <code>[&#123; "role": "user", "content": "..." &#125;]</code>.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-card border rounded-xl overflow-hidden mt-6">
                  <div className="px-6 py-4 border-b bg-muted/20 font-semibold text-sm">Response Format</div>
                  <div className="p-6 bg-black/40 font-mono text-xs text-slate-300">
                    <pre>
                      {`{
  "reply": "The response from the AI",
  "agentName": "Customer Support",
  "agentId": "cmmj...",
  "usage": "24/1000"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Error Codes Section */}
            <section id="error-handling">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  < ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Error Codes</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Understand the responses when things don't go as planned.
              </p>
              
              <div className="bg-card border rounded-xl overflow-hidden">
                <div className="p-6 overflow-x-auto text-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left pb-4 font-medium">HTTP Code</th>
                        <th className="text-left pb-4 font-medium">Error Code</th>
                        <th className="text-left pb-4 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="py-4 font-mono text-red-400">401</td>
                        <td className="py-4 font-mono text-primary font-bold">INVALID_KEY</td>
                        <td className="py-4 text-muted-foreground">The provided API key is invalid or has been revoked.</td>
                      </tr>
                      <tr>
                        <td className="py-4 font-mono text-red-400">403</td>
                        <td className="py-4 font-mono text-primary font-bold">QUOTA_EXCEEDED</td>
                        <td className="py-4 text-muted-foreground">Usage limit (1,000 requests) exceeded for the Free plan.</td>
                      </tr>
                      <tr>
                        <td className="py-4 font-mono text-red-400">403</td>
                        <td className="py-4 font-mono text-primary font-bold">TRIAL_EXPIRED</td>
                        <td className="py-4 text-muted-foreground">Free trial limit (3 days) has expired. Upgrade your plan.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Implementation Examples */}
            <section id="examples">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Terminal className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Integration Examples</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-muted rounded border uppercase text-muted-foreground">cURL</span>
                    Terminal Request
                  </h3>
                  <div className="bg-black/40 border rounded-xl p-6 font-mono text-sm group relative overflow-x-auto">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute right-3 top-3 transition-opacity h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleCopy(`curl -X POST ${baseUrl || 'https://chatbotagent.shwetatech.com'}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"message": "Hello!"}'`, 'curl')}
                    >
                      {copiedBlock === 'curl' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="text-slate-300">
                      {`curl -X POST ${baseUrl || 'https://chatbotagent.shwetatech.com'}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"message": "Hello!"}'`}
                    </pre>
                  </div>
                </div>

                 <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-muted rounded border uppercase text-muted-foreground">JS</span>
                    JavaScript (Fetch)
                  </h3>
                  <div className="bg-black/40 border rounded-xl p-6 font-mono text-sm group relative overflow-x-auto">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute right-3 top-3 transition-opacity h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleCopy(`const response = await fetch('${baseUrl || 'https://chatbotagent.shwetatech.com'}/api/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    message: "Hi, I have a question about the platform.",
    history: []
  })
});

const data = await response.json();
console.log(data.reply);`, 'js')}
                    >
                      {copiedBlock === 'js' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="text-slate-300">
                      {`const response = await fetch('${baseUrl || 'https://chatbotagent.shwetatech.com'}/api/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    message: "Hi, I have a question about the platform.",
    history: []
  })
});

const data = await response.json();
console.log(data.reply);`}
                    </pre>
                  </div>
                </div>
              </div>
            {/* WordPress Integration Section */}
            <section id="wordpress-integration">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">WordPress Integration</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Connect your AI agents to WordPress instantly using our dedicated plugin.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-xl border bg-card/50">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">1</span>
                    Dynamic Download
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Generate a pre-configured <code>.zip</code> file directly from your agent's dashboard. It includes your Agent ID and Base URL automatically.
                  </p>
                </div>
                <div className="p-6 rounded-xl border bg-card/50">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">2</span>
                    Instant Activation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload the <code>.zip</code> to your WordPress Plugins section, activate it, and your chatbot will appear instantly.
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary italic">
                <strong>Tip:</strong> The plugin is fully white-labeled and uses a floating widget that stays synced with your dashboard settings.
              </div>
            </section>

            {/* Implementation Examples Section ends here, added above */}
            </section>

            {/* Best Practices */}
            <section id="best-practices" className="bg-gradient-to-br from-card to-primary/5 border rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Best Practices
              </h3>
              <ul className="space-y-4 text-muted-foreground leading-relaxed">
                <li className="flex gap-3">
                  <span className="text-primary mt-1">●</span>
                  <span><strong>Server-Side Proxy:</strong> Always call the API from your backend (Node.js, Python, etc.) rather than the browser to keep your API key hidden.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary mt-1">●</span>
                  <span><strong>Agent Scoping:</strong> Use unique API keys for different use cases to track usage and control access granularly.</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
