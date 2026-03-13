import { useState } from 'react';
import { Calendar, Mail, CreditCard, Ticket, Search, Plus, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { GradientButton } from '../gradient-button';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import { ComingSoon } from '../coming-soon';

interface Action {
  id: string;
  icon: any;
  name: string;
  description: string;
  trigger: string;
  enabled: boolean;
}

interface ActionsTabProps {
  agentId?: string;
}

export function ActionsTab({ agentId }: ActionsTabProps) {
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [actions, setActions] = useState<Action[]>([
    {
      id: '1',
      icon: Calendar,
      name: 'Calendly - Schedule Meeting',
      description: 'Automatically book meetings when customers ask',
      trigger: 'When user asks about "demo" or "meeting"',
      enabled: true,
    },
    {
      id: '2',
      icon: Mail,
      name: 'Collect Leads',
      description: 'Capture name, email, phone during conversations',
      trigger: 'When user shows interest',
      enabled: true,
    },
    {
      id: '3',
      icon: CreditCard,
      name: 'Stripe - Check Subscription',
      description: 'Access customer subscription status and billing',
      trigger: 'When user asks about "subscription" or "billing"',
      enabled: true,
    },
    {
      id: '4',
      icon: Ticket,
      name: 'Zendesk - Create Ticket',
      description: 'Create support tickets for complex issues',
      trigger: 'Manual escalation by agent',
      enabled: false,
    },
    {
      id: '5',
      icon: Search,
      name: 'Web Search',
      description: 'Search the web for real-time information',
      trigger: 'When agent needs current data',
      enabled: false,
    },
  ]);

  const toggleAction = (id: string) => {
    setActions(
      actions.map((action) =>
        action.id === id ? { ...action, enabled: !action.enabled } : action
      )
    );
  };
  return (
    <>
      <div className="p-8 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Actions</h2>
              <p className="text-text-secondary">
                Enable your agent to take actions and integrate with tools
              </p>
            </div>

            <GradientButton className="gap-2">
              <Plus className="h-4 w-4" />
              Create Action
            </GradientButton>
          </div>

          <div className="text-sm text-text-secondary">
            Available Actions (5/10 used)
          </div>
        </div>

        {/* Actions list */}
        <div className="space-y-3 mb-8">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                className="bg-card rounded-xl p-6 border border-border hover:border-border-emphasis transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-secondary">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{action.name}</h3>
                        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${action.enabled
                          ? 'bg-success/10 text-success'
                          : 'bg-text-muted/10 text-text-muted'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${action.enabled ? 'bg-success' : 'bg-text-muted'
                            }`} />
                          {action.enabled ? 'Active' : 'Disabled'}
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary mb-2">{action.description}</p>
                      <div className="text-xs text-text-muted">
                        <span className="font-medium">Trigger:</span> {action.trigger}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAction(action)}
                    >
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={action.enabled}
                      onCheckedChange={() => toggleAction(action.id)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Integration marketplace */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="font-semibold mb-2">Need more integrations?</h3>
          <p className="text-sm text-text-secondary mb-4">
            Browse our marketplace to connect with 5000+ tools and services
          </p>
          <Button variant="outline" className="bg-transparent">
            Browse Integration Marketplace →
          </Button>
        </div>

        {/* Action configuration modal */}
        <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Configure: {selectedAction?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedAction && (
              <div className="py-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={selectedAction.enabled}
                      onCheckedChange={() => toggleAction(selectedAction.id)}
                    />
                    <span className="text-sm text-text-secondary">
                      {selectedAction.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {selectedAction.id === '1' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Calendly Account</label>
                      <Select defaultValue="john@company.com">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="john@company.com">john@company.com</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Event Type</label>
                      <Select defaultValue="30min">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30min">30 Min Demo Call</SelectItem>
                          <SelectItem value="60min">60 Min Consultation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Trigger Conditions</label>
                  <p className="text-sm text-text-muted mb-2">When user message contains:</p>
                  <Input
                    defaultValue={selectedAction.trigger}
                    placeholder="demo, meeting, schedule, book, appointment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirmation Message</label>
                  <Textarea
                    rows={4}
                    defaultValue="I've scheduled a meeting for you on {date} at {time}. You'll receive a confirmation email shortly."
                    placeholder="Enter confirmation message..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setSelectedAction(null)}>
                    Cancel
                  </Button>
                  <GradientButton onClick={() => setSelectedAction(null)}>
                    Save Changes
                  </GradientButton>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
