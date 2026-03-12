import { Plus, Target, Zap, Smile, Check, MessageSquare, TrendingUp } from 'lucide-react';
import { PageHeader } from '../page-header';
import { GradientButton } from '../gradient-button';
import { StatCard } from '../stat-card';
import { AgentCard } from '../agent-card';
import { useSession } from 'next-auth/react';
import { useAgents } from '@/contexts/AgentsContext';

interface DashboardHomeProps {
  onNavigateToAgent: (agentId: string) => void;
  onCreateAgent: () => void;
}

export function DashboardHome({ onNavigateToAgent, onCreateAgent }: DashboardHomeProps) {
  const { data: session } = useSession();
  const { agents } = useAgents();

  const userName = session?.user?.name || 'there';

  // Calculate dynamic stats
  const totalConversations = agents.reduce((acc, agent) => acc + (agent.conversations || 0), 0);
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const totalSources = agents.reduce((acc, agent) => acc + (agent.sources || 0), 0);

  // Fake activity for UI (could be connected to a real activity API later)
  const recentActivity = agents.length > 0 ? [
    {
      user: 'Sarah M.',
      agent: agents[0].name,
      time: 'Just now',
      status: 'active',
    },
    {
      user: 'John D.',
      agent: agents[0].name,
      time: '12 minutes ago',
      status: 'active',
    }
  ] : [];

  return (
    <div className="p-4 md:p-8 overflow-y-auto h-full">
      <PageHeader
        title={`Welcome back, ${userName}!`}
        description={`Here's what's happening with your chatbots today`}
        action={
          <GradientButton onClick={onCreateAgent} className="gap-2">
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Create New Agent</span>
            <span className="sm:hidden">New</span>
          </GradientButton>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatCard
          icon={Target}
          label="Total Conversations"
          value={totalConversations.toLocaleString()}
          change="+0%"
          trend="up"
        />
        <StatCard
          icon={Zap}
          label="Active Agents"
          value={activeAgents.toString()}
          change="Live"
          trend="up"
        />
        <StatCard
          icon={Smile}
          label="Total Sources"
          value={totalSources.toString()}
          change="Indexed"
          trend="up"
        />
        <StatCard
          icon={Check}
          label="Plan Status"
          value={(session?.user as any)?.plan || 'FREE'}
          change="Current"
          trend="up"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl p-6 border border-border mb-8">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onCreateAgent}
            className="p-4 rounded-lg border border-border hover:border-border-emphasis transition-all bg-secondary hover:bg-bg-hover text-left group"
          >
            <Plus className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-medium mb-1">Create New Agent</div>
            <div className="text-sm text-text-secondary">
              Build a new AI chatbot in minutes
            </div>
          </button>

          <button
            onClick={() => {
              if (agents.length > 0) {
                onNavigateToAgent(agents[0].id);
              } else {
                onCreateAgent();
              }
            }}
            className="p-4 rounded-lg border border-border hover:border-border-emphasis transition-all bg-secondary hover:bg-bg-hover text-left group"
          >
            <MessageSquare className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-medium mb-1">View Conversations</div>
            <div className="text-sm text-text-secondary">Check recent chat activity</div>
          </button>

          <button className="p-4 rounded-lg border border-border hover:border-border-emphasis transition-all bg-secondary hover:bg-bg-hover text-left group">
            <TrendingUp className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-medium mb-1">Check Analytics</div>
            <div className="text-sm text-text-secondary">Review performance metrics</div>
          </button>
        </div>
      </div>

      {/* AI Agents */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Your AI Agents</h3>
            <p className="text-sm text-text-secondary">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} created
            </p>
          </div>
          {agents.length > 0 && <button className="text-sm text-primary hover:underline">View All →</button>}
        </div>

        {agents.length === 0 ? (
          <div className="bg-secondary/30 border-2 border-dashed border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-xl font-bold mb-2">No agents yet</h4>
            <p className="text-text-secondary mb-6 max-w-sm mx-auto">
              Create your first AI agent trained on your data and start automating your customer support.
            </p>
            <GradientButton onClick={onCreateAgent} className="gap-2">
              <Plus className="h-5 w-5" />
              Create My First Agent
            </GradientButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agentId={agent.id}
                name={agent.name}
                status={agent.status}
                conversations={agent.conversations || 0}
                lastActive="Just now"
                onClick={() => onNavigateToAgent(agent.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <button className="text-sm text-primary hover:underline">View All →</button>
        </div>

        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                  {activity.user.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-sm">{activity.user}</div>
                  <div className="text-xs text-text-muted">{activity.agent}</div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${activity.status === 'resolved'
                    ? 'bg-success/10 text-success'
                    : activity.status === 'active'
                      ? 'bg-info/10 text-info'
                      : 'bg-warning/10 text-warning'
                    }`}
                >
                  {activity.status}
                </div>
                <div className="text-xs text-text-muted mt-1">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}