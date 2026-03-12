import { Target, Zap, Smile, Check, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { StatCard } from '../stat-card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const conversationData = [
  { date: 'Jan 1', conversations: 32 },
  { date: 'Jan 5', conversations: 45 },
  { date: 'Jan 10', conversations: 38 },
  { date: 'Jan 15', conversations: 52 },
  { date: 'Jan 20', conversations: 61 },
  { date: 'Jan 25', conversations: 48 },
  { date: 'Jan 30', conversations: 55 },
];

const topicsData = [
  { topic: 'Pricing questions', count: 234, percentage: 38 },
  { topic: 'Product features', count: 156, percentage: 25 },
  { topic: 'Billing issues', count: 89, percentage: 14 },
  { topic: 'Account setup', count: 67, percentage: 11 },
  { topic: 'Technical support', count: 45, percentage: 7 },
];

import { ComingSoon } from '../coming-soon';

export function AnalyticsTab() {
  return (
    <>
      <ComingSoon
        title="Analytics"
        description="Track performance and insights for your chatbot. Get detailed metrics on conversations, response quality, and user satisfaction."
      />

      {/* Hidden original content preserved for future use */}
      <div className="hidden">
        <div className="p-8 max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Analytics</h2>
                <p className="text-text-secondary">
                  Track performance and insights for your chatbot
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Select defaultValue="30days">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="bg-transparent">Export</Button>
              </div>
            </div>
          </div>

          {/* Overview stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          {/* Additional metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-secondary">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-sm text-text-muted">Escalated</div>
                  <div className="text-2xl font-bold">8%</div>
                </div>
              </div>
              <div className="text-xs text-text-muted">+1% from last period</div>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-secondary">
                  <Users className="h-5 w-5 text-info" />
                </div>
                <div>
                  <div className="text-sm text-text-muted">Leads Captured</div>
                  <div className="text-2xl font-bold">23</div>
                </div>
              </div>
              <div className="text-xs text-text-muted">+5 from last period</div>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-secondary">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-text-muted">Avg Confidence</div>
                  <div className="text-2xl font-bold">87%</div>
                </div>
              </div>
              <div className="text-xs text-text-muted">Quality score</div>
            </div>
          </div>

          {/* Conversation volume chart */}
          <div className="bg-card rounded-xl p-6 border border-border mb-8">
            <h3 className="font-semibold mb-6">Conversation Volume</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="#71717A" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#71717A" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181B',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversations"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={{ fill: '#6366F1', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top topics */}
          <div className="bg-card rounded-xl p-6 border border-border mb-8">
            <h3 className="font-semibold mb-6">Top Topics</h3>
            <div className="space-y-4">
              {topicsData.map((topic, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-muted">
                        {index + 1}.
                      </span>
                      <span className="text-sm">{topic.topic}</span>
                      <span className="text-sm text-text-muted">({topic.count})</span>
                    </div>
                    <span className="text-sm font-medium">{topic.percentage}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${topic.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response quality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-4">Response Quality</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Average confidence score</span>
                  <span className="font-medium">87%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Unanswered questions</span>
                  <button className="font-medium text-primary hover:underline">23 (View →)</button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Low confidence responses</span>
                  <button className="font-medium text-primary hover:underline">45 (Review →)</button>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold mb-4">Suggestions (3 new)</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-text-secondary">Add FAQ about </span>
                    <button className="text-primary hover:underline font-medium">
                      "enterprise pricing"
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-text-secondary">Improve answers for </span>
                    <button className="text-primary hover:underline font-medium">
                      "integration setup"
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-text-secondary">Update </span>
                    <button className="text-primary hover:underline font-medium">
                      "refund policy"
                    </button>
                    <span className="text-text-secondary"> information</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
