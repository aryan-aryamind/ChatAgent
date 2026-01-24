import { useState } from 'react';
import {
  Globe,
  MessageSquare,
  Code,
  Settings as SettingsIcon,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Button } from '../ui/button';
import { GradientButton } from '../gradient-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function DeployTab() {
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedCode = `<script>
  window.embeddedChatbotConfig = {
    chatbotId: "your-id-here",
    domain: "www.chatbase.co"
  }
</script>
<script
  src="https://www.chatbase.co/embed.min.js"
  chatbotId="your-id-here"
  domain="www.chatbase.co"
  defer>
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const integrations = [
    {
      id: 'widget',
      icon: Globe,
      name: 'Chat Widget',
      description: 'Add a floating chat widget to your website',
      status: 'active',
      color: 'primary',
    },
    {
      id: 'fullpage',
      icon: MessageSquare,
      name: 'Help Page (Full Page Chat)',
      description: 'Dedicated chat-style help page',
      status: 'enabled',
      url: 'chatbase.co/c/your-agent-id',
      color: 'primary',
    },
    {
      id: 'whatsapp',
      icon: MessageSquare,
      name: 'WhatsApp',
      description: 'Connect your WhatsApp Business account',
      status: 'not-connected',
      color: 'success',
    },
    {
      id: 'messenger',
      icon: MessageSquare,
      name: 'Facebook Messenger',
      description: 'Add chatbot to your Facebook page',
      status: 'not-connected',
      color: 'info',
    },
    {
      id: 'instagram',
      icon: MessageSquare,
      name: 'Instagram DM',
      description: 'Respond to Instagram direct messages',
      status: 'not-connected',
      color: 'warning',
    },
    {
      id: 'slack',
      icon: MessageSquare,
      name: 'Slack',
      description: 'Add bot to your Slack workspace',
      status: 'not-connected',
      color: 'primary',
    },
    {
      id: 'api',
      icon: Code,
      name: 'API',
      description: 'Integrate with custom applications',
      status: 'enabled',
      apiKey: 'cbsk_xxxxxxxxxxxxx',
      color: 'muted',
    },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Deploy</h2>
        <p className="text-text-secondary">Deploy your agent across multiple channels</p>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <div
              key={integration.id}
              className="bg-card rounded-xl p-6 border border-border hover:border-border-emphasis transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-secondary">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{integration.name}</h3>
                    <p className="text-sm text-text-secondary mb-2">{integration.description}</p>

                    {integration.status === 'active' && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-success">
                          <div className="w-2 h-2 rounded-full bg-success" />
                          Active
                        </div>
                      </div>
                    )}

                    {integration.status === 'enabled' && integration.url && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-text-muted">URL:</span>
                        <code className="px-2 py-1 rounded bg-secondary text-xs">
                          {integration.url}
                        </code>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {integration.status === 'enabled' && integration.apiKey && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-text-muted">API Key:</span>
                        <code className="px-2 py-1 rounded bg-secondary text-xs">
                          {integration.apiKey}
                        </code>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          Show
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {integration.status === 'not-connected' && (
                      <div className="text-sm text-text-muted">Not Connected</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {integration.status === 'active' || integration.status === 'enabled' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        integration.id === 'widget' && setShowWidgetConfig(true)
                      }
                      className="bg-transparent"
                    >
                      {integration.id === 'api' ? (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Docs
                        </>
                      ) : (
                        <>
                          <SettingsIcon className="h-4 w-4 mr-2" />
                          Configure
                        </>
                      )}
                    </Button>
                  ) : (
                    <GradientButton size="sm">Connect</GradientButton>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" className="bg-transparent">
          Browse All Integrations →
        </Button>
      </div>

      {/* Widget Configuration Modal */}
      <Dialog open={showWidgetConfig} onOpenChange={setShowWidgetConfig}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chat Widget Configuration</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="code" className="mt-4">
            <TabsList>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Installation</h4>
                <p className="text-sm text-text-secondary mb-4">
                  1. Copy this code snippet:
                </p>
                <div className="relative">
                  <pre className="bg-secondary rounded-lg p-4 overflow-x-auto text-sm border border-border">
                    <code>{embedCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 bg-background"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-text-secondary mt-4">
                  2. Paste before the closing {'</body>'} tag
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Quick Integrations</h4>
                <div className="grid grid-cols-5 gap-2">
                  {['WordPress', 'Shopify', 'Wix', 'Webflow', 'Bubble'].map((platform) => (
                    <Button key={platform} variant="outline" size="sm" className="bg-transparent">
                      {platform}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="general" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <Input defaultValue="Support Assistant" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <div className="font-medium">Show Agent Avatar</div>
                  <div className="text-sm text-text-muted">Display avatar in messages</div>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <div className="font-medium">Show Timestamps</div>
                  <div className="text-sm text-text-muted">Display message timestamps</div>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <Select defaultValue="dark">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <Input type="color" defaultValue="#6366F1" className="w-20 h-10" />
                  <Input defaultValue="#6366F1" className="flex-1" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Widget Position</label>
                <Select defaultValue="bottom-right">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Auto-show After (seconds)
                </label>
                <Input type="number" defaultValue="5" />
                <p className="text-xs text-text-muted mt-1">Set to -1 to disable</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <div className="font-medium">Full-screen on Mobile</div>
                  <div className="text-sm text-text-muted">Open in full screen on mobile</div>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowWidgetConfig(false)}>
              Close
            </Button>
            <GradientButton>Save Changes</GradientButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
