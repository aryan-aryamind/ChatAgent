import { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, Brain, Zap } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { GradientButton } from '../gradient-button';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useAgents } from '@/contexts/AgentsContext';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

interface SettingsTabProps {
  agentStatus: 'active' | 'disabled' | 'hidden';
  onStatusChange: (status: 'active' | 'disabled' | 'hidden') => void;
  agentId?: string;
}

export function SettingsTab({ agentStatus, onStatusChange, agentId }: SettingsTabProps) {
  const router = useRouter();
  const { getAgent, updateAgent, deleteAgent } = useAgents();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const agent = agentId ? getAgent(agentId) : undefined;

  const [agentName, setAgentName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.useCase || '');
  const [initialMessage, setInitialMessage] = useState(
    agent?.initialMessage || "Hey! I'm here to help. What can I do for you today? 👋"
  );

  useEffect(() => {
    if (agent) {
      setAgentName(agent.name);
      setDescription(agent.useCase || '');
      setInitialMessage(agent.initialMessage || "Hey! I'm here to help. What can I do for you today? 👋");
    }
  }, [agent]);

  const handleSave = async () => {
    if (!agentId) return;

    try {
      await updateAgent(agentId, {
        name: agentName,
        useCase: description,
        initialMessage,
        status: agentStatus,
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };


  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Agent Settings</h2>
          <p className="text-text-secondary">Manage your agent's identity and core brain</p>
        </div>
        <GradientButton onClick={handleSave}>Save Changes</GradientButton>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 border border-border">
          <TabsTrigger value="general">General</TabsTrigger>
          {/* <TabsTrigger value="behavior">AI Behavior</TabsTrigger> */}
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6 animate-in fade-in duration-300">
          <div>
            <label className="block text-sm font-semibold mb-2">Agent Name</label>
            <Input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g. Sales Assistant"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Instructions / Persona</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what this agent does"
            />
          </div>

          <div className="pt-2">
            <label className="block text-sm font-semibold mb-3">Agent Availability</label>
            <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${agentStatus === 'active'
              ? 'border-primary/50 bg-primary/5'
              : 'border-border bg-secondary/30'
              }`}>
              <Switch
                checked={agentStatus === 'active'}
                onCheckedChange={(checked) =>
                  onStatusChange(checked ? 'active' : 'disabled')
                }
              />
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {agentStatus === 'active' ? 'Publicly Active' : 'Offline / Restricted'}
                </div>
                <div className="text-xs text-text-muted">
                  {agentStatus === 'active'
                    ? 'Agent is live and ready to interact with users'
                    : 'Agent is hidden from public view and only accessible to you'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b border-border pb-2">Welcome Experience</h3>

            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary">Greeting Message</label>
              <Textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                rows={3}
              />
            </div>

          </div>
        </TabsContent>

        {/* No AI Behavior Content */}

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-8 animate-in fade-in duration-300">

          <div className="pt-6">
            <h3 className="text-sm font-semibold mb-4 text-destructive border-b border-destructive/20 pb-2">Danger Zone</h3>
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <h4 className="font-bold text-destructive mb-1">Delete this Agent</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    This will permanently remove the agent, its settings, and all associated conversation history. This action is irreversible.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Terminate Agent
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-card w-[95%] max-w-md rounded-2xl border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-text-secondary">
                This will delete <strong className="text-foreground">{agentName}</strong> and all of its data. We cannot recover it once deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)} className="rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (agentId) {
                    deleteAgent(agentId);
                    toast.success('Agent permanently deleted');
                    router.push('/agents');
                  }
                  setShowDeleteDialog(false);
                }}
                className="bg-destructive text-white hover:bg-destructive/90 rounded-xl"
              >
                Permanently Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Tabs>
    </div>
  );
}
