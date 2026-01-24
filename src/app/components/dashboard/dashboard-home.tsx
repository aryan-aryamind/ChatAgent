import { Plus, Target, Zap, Smile, Check, MessageSquare, TrendingUp } from 'lucide-react';
import { PageHeader } from '../page-header';
import { GradientButton } from '../gradient-button';
import { StatCard } from '../stat-card';
import { AgentCard } from '../agent-card';

interface DashboardHomeProps {
  onNavigateToAgent: (agentId: string) => void;
  onCreateAgent: () => void;
}

export function DashboardHome({ onNavigateToAgent, onCreateAgent }: DashboardHomeProps) {
  const agents = [
    {
      id: '1',
      name: 'Support Agent',
      status: 'active' as const,
      conversations: 245,
      lastActive: '2 hours ago',
    },
    {
      id: '2',
      name: 'Sales Assistant',
      status: 'active' as const,
      conversations: 156,
      lastActive: '5 hours ago',
    },
    {
      id: '3',
      name: 'FAQ Bot',
      status: 'disabled' as const,
      conversations: 0,
      lastActive: 'Never',
    },
  ];

  const recentActivity = [
    {
      user: 'Sarah M.',
      agent: 'Support Agent',
      time: '5 minutes ago',
      status: 'resolved',
    },
    {
      user: 'John D.',
      agent: 'Sales Assistant',
      time: '12 minutes ago',
      status: 'active',
    },
    {
      user: 'Emily R.',
      agent: 'Support Agent',
      time: '1 hour ago',
      status: 'resolved',
    },
    {
      user: 'Mike C.',
      agent: 'Sales Assistant',
      time: '2 hours ago',
      status: 'escalated',
    },
  ];

  return (
    <div className="p-4 md:p-8 overflow-y-auto h-full">
      <PageHeader
        title="Welcome back, John!"
        description="Here's what's happening with your chatbots today"
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
          value="1,234"
          change="+12%"
          trend="up"
        />
        <StatCard
          icon={Zap}
          label="Avg Response Time"
          value="2.3s"
          change="-0.5s"
          trend="down"
        />
        <StatCard
          icon={Smile}
          label="Satisfaction Rate"
          value="89%"
          change="+3%"
          trend="up"
        />
        <StatCard
          icon={Check}
          label="Resolution Rate"
          value="92%"
          change="+2%"
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
            onClick={() => onNavigateToAgent('1')}
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
            <p className="text-sm text-text-secondary">3 of 5 agents created</p>
          </div>
          <button className="text-sm text-primary hover:underline">View All →</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              name={agent.name}
              status={agent.status}
              conversations={agent.conversations}
              lastActive={agent.lastActive}
              onClick={() => onNavigateToAgent(agent.id)}
            />
          ))}
        </div>
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
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'resolved'
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