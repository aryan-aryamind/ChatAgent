import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { PlaygroundTab } from './playground-tab';
import { AnalyticsTab } from './analytics-tab';
import { DeployTab } from './deploy-tab';
import { SettingsTab } from './settings-tab';
import { ComingSoon } from '../coming-soon';
import { useAgents } from '@/contexts/AgentsContext';

interface AgentBuilderProps {
  agentId: string | null;
  onBack: () => void;
}

export function AgentBuilder({ agentId, onBack }: AgentBuilderProps) {
  const { getAgent, updateAgent } = useAgents();
  const agent = agentId ? getAgent(agentId) : null;
  const [agentName, setAgentName] = useState(agent?.name || 'New Agent');
  const [isEditingName, setIsEditingName] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'active' | 'disabled' | 'hidden'>(
    agent?.status || 'active'
  );

  useEffect(() => {
    if (agent) {
      setAgentName(agent.name);
      setAgentStatus(agent.status);
    }
  }, [agent]);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (agentId && agentName.trim() && agentName !== agent?.name) {
      updateAgent(agentId, { name: agentName.trim() });
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setAgentName(agent?.name || 'New Agent');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Agents
            </Button>
            <div className="h-6 w-px bg-border" />
            {isEditingName ? (
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                className="text-xl font-bold bg-transparent border-b-2 border-primary outline-none px-1 min-w-[200px]"
                autoFocus
              />
            ) : (
              <h1
                className="text-xl font-bold cursor-pointer hover:text-primary transition-colors"
                onClick={() => setIsEditingName(true)}
                title="Click to edit"
              >
                {agentName || 'Untitled Agent'}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${agentStatus === 'active'
              ? 'bg-success/10 text-success'
              : 'bg-text-muted/10 text-text-muted'
              }`}>
              <div className={`w-2 h-2 rounded-full ${agentStatus === 'active' ? 'bg-success' : 'bg-text-muted'
                }`} />
              {agentStatus === 'active' ? 'Active' : agentStatus === 'disabled' ? 'Disabled' : 'Hidden'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="playground" className="h-full flex flex-col">
          <div className="border-b border-border px-6">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="playground">Playground</TabsTrigger>
              <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="deploy">Deploy</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <TabsContent value="playground" className="m-0 h-full">
              <PlaygroundTab
                agentId={agentId || undefined}
                responseMode={(agent as any)?.responseMode || 'llm'}
                agent={agent || undefined}
              />
            </TabsContent>

            <TabsContent value="data-sources" className="m-0 h-full">
              <ComingSoon
                title="Data Sources"
                description="Data Sources configuration is currently under development. You will soon be able to connect your agent to various external data providers."
              />
            </TabsContent>

            <TabsContent value="actions" className="m-0 h-full">
              <ComingSoon
                title="Actions"
                description="Agent Actions are currently under development. You will soon be able to configure specific tools and APIs for your agent to execute."
              />
            </TabsContent>

            <TabsContent value="analytics" className="m-0 h-full">
              <AnalyticsTab agentId={agentId || undefined} />
            </TabsContent>

            <TabsContent value="activity" className="m-0 h-full">
              <ComingSoon
                title="Activity"
                description="Activity monitoring is currently under development. You will soon be able to view detailed interaction logs and metrics."
              />
            </TabsContent>

            <TabsContent value="deploy" className="m-0 h-full">
              <DeployTab agentId={agentId || undefined} />
            </TabsContent>

            <TabsContent value="settings" className="m-0 h-full">
              <SettingsTab
                agentStatus={agentStatus}
                onStatusChange={(status) => {
                  setAgentStatus(status);
                  if (agentId) {
                    updateAgent(agentId, { status });
                  }
                }}
                agentId={agentId || undefined}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
