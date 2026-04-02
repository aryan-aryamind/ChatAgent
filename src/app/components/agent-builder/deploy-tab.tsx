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
import { cn } from '../ui/utils';
import { GradientButton } from '../gradient-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, Clock } from 'lucide-react';
import { useAgents } from '@/contexts/AgentsContext';
import { format } from 'date-fns';

interface DeployTabProps {
  agentId?: string;
}

export function DeployTab({ agentId }: DeployTabProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { getAgent } = useAgents();
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const [showWordPressConfig, setShowWordPressConfig] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const baseUrl = (typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : '');

  const agent = agentId ? getAgent(agentId) : null;
  const expiresAt = agent?.expiresAt ? new Date(agent.expiresAt) : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;

  const embedCode = `<iframe
  src="${baseUrl}/chatbot/${agentId || 'your-agent-id'}?view=widget"
  width="100%"
  style="height: 100%; min-height: 700px"
  frameborder="0"
></iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteAgent = async () => {
    if (!agentId) return;
    if (!confirm('Are you sure you want to delete this chatbot? This action cannot be undone.')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/agents/${agentId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Agent deleted successfully');
        router.push('/agents');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete agent');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('An error occurred while deleting the agent');
    } finally {
      setIsDeleting(false);
    }
  };

  const integrations = [
    {
      id: 'iframe',
      icon: Code,
      name: 'Embed on Website (Iframe)',
      description: 'Embed the chatbot directly into your website using an iframe',
      status: 'active',
      color: 'primary',
    },
    {
      id: 'wordpress',
      icon: Globe,
      name: 'WordPress Plugin',
      description: 'Add chatbot to your WordPress site with our custom plugin (pre-configured ZIP)',
      status: 'enabled',
      url: agentId ? `/api/agents/${agentId}/download-plugin` : null,
      color: 'primary',
    },
    {
      id: 'shopify',
      icon: Globe,
      name: 'Shopify Store',
      description: 'Integrate the chatbot with your Shopify storefront',
      status: 'coming-soon',
      color: 'success',
    },
    {
      id: 'whatsapp',
      icon: MessageSquare,
      name: 'WhatsApp',
      description: 'Connect your WhatsApp Business account',
      status: 'coming-soon',
      color: 'success',
    },
    {
      id: 'messenger',
      icon: MessageSquare,
      name: 'Facebook Messenger',
      description: 'Add chatbot to your Facebook page',
      status: 'coming-soon',
      color: 'info',
    },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Deploy</h2>
        <p className="text-text-secondary">Deploy your agent across multiple channels</p>
      </div>

      {expiresAt && (
        <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 ${isExpired
          ? 'bg-red-500/10 border-red-500/20 text-red-500'
          : 'bg-primary/10 border-primary/20 text-primary'
          }`}>
          <Clock className="h-5 w-5" />
          <div className="flex-1">
            <div className="font-semibold text-sm">
              {isExpired ? 'This agent has expired' : 'Limited Time Usage'}
            </div>
            <div className="text-xs opacity-80">
              {isExpired
                ? `Expired on ${format(expiresAt, 'PPP p')}`
                : `Expires on ${format(expiresAt, 'PPP p')} (+24h for FREE tier)`
              }
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const isComingSoon = integration.status === 'coming-soon';
          return (
            <div
              key={integration.id}
              className={cn(
                "bg-card rounded-xl p-6 border border-border transition-all",
                !isComingSoon && "hover:border-border-emphasis",
                isComingSoon && "opacity-60 grayscale-[0.5]"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={cn(
                    "p-3 rounded-lg",
                    isComingSoon ? "bg-muted" : "bg-secondary"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6",
                      isComingSoon ? "text-text-muted" : "text-primary"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{integration.name}</h3>
                      {isComingSoon && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          Coming Soon
                        </span>
                      )}
                    </div>
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
                      <div className="flex items-center gap-2 text-sm min-w-0">
                        <span className="text-text-muted shrink-0">URL:</span>
                        <code className="px-2 py-1 rounded bg-secondary text-xs truncate font-mono">
                          {integration.url}
                        </code>
                        <Button variant="ghost" size="sm" className="h-6 px-2 shrink-0" type="button">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isComingSoon ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (integration.id === 'iframe') {
                          setShowWidgetConfig(true);
                        } else if (integration.id === 'wordpress') {
                          setShowWordPressConfig(true);
                        }
                      }}
                      className="bg-transparent"
                      type="button"
                    >
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled className="cursor-not-allowed">
                      Coming Soon
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" className="bg-transparent" type="button">
          Browse All Integrations →
        </Button>
      </div>

      <div className="mt-12 pt-8 border-t border-red-500/20">
        <div className="bg-red-500/5 rounded-xl p-6 border border-red-500/20">
          <div className="flex items-center gap-3 mb-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-bold">Danger Zone</h3>
          </div>
          <p className="text-sm text-text-secondary mb-6">
            Once you delete a chatbot, there is no going back. Please be certain.
          </p>
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={handleDeleteAgent}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete this chatbot'}
          </Button>
        </div>
      </div>

      {/* Widget Configuration Modal */}
      {showWidgetConfig && (
        <Dialog open={showWidgetConfig} onOpenChange={setShowWidgetConfig}>
          <DialogContent className="max-w-2xl w-full">
            <DialogHeader className="min-w-0">
              <DialogTitle className="truncate">Chat Widget Configuration</DialogTitle>
              <DialogDescription className="truncate">
                Configure how your chatbot widget looks and behaves on your website.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 min-w-0 w-full overflow-hidden">
              <Tabs defaultValue="code" className="w-full">
                <TabsList>
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="behavior">Behavior</TabsTrigger>
                </TabsList>

                <div className="min-w-0 w-full overflow-hidden">
                  <TabsContent value="code" className="space-y-6 mt-4">
                    <div className="min-w-0">
                      <div className="flex items-center justify-between mb-3 text-white">
                        <h4 className="font-semibold">Installation</h4>
                      </div>
                      
                      <p className="text-sm text-text-secondary mb-3">
                        Embed the floating chat widget directly into your website.
                      </p>

                      <div className="rounded-lg border border-border overflow-hidden w-full max-w-full bg-[#0d0d1a]">
                        {/* Code block header bar */}
                        <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-border min-w-0">
                          <span className="text-xs text-text-muted font-mono truncate mr-2">
                            chat widget embed
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={copyToClipboard}
                            className="h-7 px-3 text-xs gap-1.5 text-text-secondary hover:text-white shrink-0"
                            type="button"
                          >
                            {copied ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                Copy Code
                              </>
                            )}
                          </Button>
                        </div>
                        {/* Code block body */}
                        <pre className="p-4 overflow-x-auto max-h-48 w-full block min-w-0">
                          <code className="text-xs font-mono text-green-400 leading-relaxed whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal">
                            {embedCode}
                          </code>
                        </pre>
                      </div>
                      <p className="text-sm text-text-secondary mt-3">
                        2. Paste this iframe code into your website where you want the chatbot to appear.
                      </p>
                    </div>

                    {/* <div>
                      <h4 className="font-semibold mb-3">Quick Integrations</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {['WordPress', 'Shopify', 'Wix', 'Webflow', 'Bubble'].map((platform) => (
                          <Button key={platform} variant="outline" size="sm" className="bg-transparent" type="button">
                            {platform}
                          </Button>
                        ))}
                      </div>
                    </div> */}
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
                </div>
              </Tabs>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowWidgetConfig(false)}
                type="button"
              >
                Close
              </Button>
              <GradientButton
                onClick={() => setShowWidgetConfig(false)}
                type="button"
              >
                Save Changes
              </GradientButton>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* WordPress Configuration Modal */}
      {showWordPressConfig && (
        <Dialog open={showWordPressConfig} onOpenChange={setShowWordPressConfig}>
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>WordPress Plugin Setup</DialogTitle>
              <DialogDescription>
                Follow these steps to add your chatbot to WordPress.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-4">

              {/* Step 1 – Download */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <p className="text-sm font-semibold">Download your personalized <code className="text-primary text-xs">.zip</code></p>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-primary/5 border-primary/30 hover:bg-primary/10"
                  onClick={() => {
                    if (!agentId) return;
                    window.location.href = `/api/agents/${agentId}/download-plugin`;
                  }}
                  type="button"
                >
                  <span className="truncate font-mono text-xs">ai-agent-plugin.zip</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
                </Button>
                <p className="text-xs text-green-500 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  ✨ <strong>Success:</strong> This ZIP is already pre-configured with your Agent ID and Bot URL!
                </p>
              </div>

              {/* Step 2 – Install */}
              <div className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                  <p className="text-sm font-semibold">Install the plugin in WordPress</p>
                </div>
                <ol className="text-xs text-text-secondary space-y-1 pl-8 list-decimal">
                  <li>Go to your <strong>WordPress Admin Panel</strong></li>
                  <li>Navigate to <strong>Plugins → Add New</strong></li>
                  <li>Click <strong>"Upload Plugin"</strong> at the top</li>
                  <li>Choose the <code>.zip</code> file you downloaded</li>
                  <li>Click <strong>"Install Now"</strong> then <strong>"Activate Plugin"</strong></li>
                </ol>
              </div>

              {/* Step 3 – Configure */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  <p className="text-sm font-semibold">Paste your Agent ID &amp; Bot URL</p>
                </div>
                <p className="text-xs text-text-secondary pl-8">After activating, go to <strong>AI Agent</strong> in the WordPress sidebar and paste these values:</p>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Agent ID</label>
                  <div className="flex gap-2">
                    <Input
                      value={agentId}
                      readOnly
                      className="bg-secondary font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(agentId || '');
                        toast.success('Agent ID copied!');
                      }}
                      type="button"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Bot URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={baseUrl}
                      readOnly
                      className="bg-secondary font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(baseUrl);
                        toast.success('Bot URL copied!');
                      }}
                      type="button"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowWordPressConfig(false)}>Done</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}