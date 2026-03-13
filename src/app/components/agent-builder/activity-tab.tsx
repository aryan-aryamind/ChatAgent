import { useState } from 'react';
import { Search, Filter, Download, Bot, User, FileCheck, ExternalLink, MessageSquare } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { GradientButton } from '../gradient-button';

interface Conversation {
  id: string;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  timestamp: string;
  status: 'active' | 'resolved' | 'escalated';
  sentiment: 'positive' | 'neutral' | 'negative';
  preview: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    confidence?: number;
    sources?: string[];
  }>;
}

import { ComingSoon } from '../coming-soon';

interface ActivityTabProps {
  agentId?: string;
}

export function ActivityTab({ agentId }: ActivityTabProps) {
  const [selectedConversation, setSelectedConversation] = useState<string>('1');
  const [filterStatus, setFilterStatus] = useState<string>('all');


  const conversations: Conversation[] = [
    {
      id: '1',
      user: {
        name: 'Sarah Miller',
        email: 'sarah.m@email.com',
        avatar: 'SM',
      },
      timestamp: '2 hours ago',
      status: 'resolved',
      sentiment: 'positive',
      preview: "What's your refund policy?",
      messages: [
        {
          role: 'user',
          content: "What's your refund policy?",
        },
        {
          role: 'assistant',
          content:
            'We offer a 30-day money back guarantee on all purchases. If you\'re not satisfied, you can request a full refund within 30 days of purchase.',
          confidence: 95,
          sources: ['FAQ.pdf'],
        },
        {
          role: 'user',
          content: 'How do I request it?',
        },
        {
          role: 'assistant',
          content:
            'To request a refund, please email support@company.com with your order number. Our team will process your refund within 3-5 business days.',
          confidence: 92,
          sources: ['FAQ.pdf'],
        },
        {
          role: 'user',
          content: 'Thank you!',
        },
      ],
    },
    {
      id: '2',
      user: {
        name: 'John Doe',
        email: 'john.d@email.com',
        avatar: 'JD',
      },
      timestamp: '5 hours ago',
      status: 'active',
      sentiment: 'neutral',
      preview: 'Do you offer enterprise plans?',
      messages: [
        {
          role: 'user',
          content: 'Do you offer enterprise plans?',
        },
        {
          role: 'assistant',
          content:
            'Yes! We offer custom enterprise plans for larger organizations. These include dedicated support, custom integrations, and volume pricing. Would you like me to connect you with our sales team?',
          confidence: 88,
        },
      ],
    },
    {
      id: '3',
      user: {
        name: 'Emily Clark',
        email: 'emily.c@email.com',
        avatar: 'EC',
      },
      timestamp: 'Yesterday',
      status: 'escalated',
      sentiment: 'negative',
      preview: 'I need help with a billing issue',
      messages: [
        {
          role: 'user',
          content: 'I need help with a billing issue. I was charged twice.',
        },
        {
          role: 'assistant',
          content:
            "I'm sorry to hear about this issue. Let me escalate this to our billing team who can investigate and resolve this for you right away. They'll reach out within the next few hours.",
          confidence: 75,
        },
      ],
    },
  ];

  const filteredConversations =
    filterStatus === 'all'
      ? conversations
      : conversations.filter((c) => c.status === filterStatus);

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  const getSentimentEmoji = (sentiment: string) => {
    return sentiment === 'positive' ? '😊' : sentiment === 'neutral' ? '😐' : '😟';
  };

  /* 
  return (
    <ComingSoon
      title="Activity"
      description="Monitor real-time conversations and track how your agent is interacting with users."
    />
  );
  */

  return (
    <>
      <div className="h-full flex overflow-hidden">
        {/* Conversations list */}
        <div className="w-96 border-r border-border flex flex-col h-full bg-card/30">
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input placeholder="Search conversations..." className="pl-9 bg-secondary/50" />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className={cn("text-xs h-8", filterStatus === 'all' ? '' : 'bg-transparent')}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
                className={cn("text-xs h-8", filterStatus === 'active' ? '' : 'bg-transparent')}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === 'resolved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('resolved')}
                className={cn("text-xs h-8", filterStatus === 'resolved' ? '' : 'bg-transparent')}
              >
                Resolved
              </Button>
              <Button
                variant={filterStatus === 'escalated' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('escalated')}
                className={cn("text-xs h-8", filterStatus === 'escalated' ? '' : 'bg-transparent')}
              >
                Escalated
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={cn(
                  'w-full p-4 border-b border-border hover:bg-secondary/50 transition-colors text-left',
                  selectedConversation === conversation.id && 'bg-secondary border-l-2 border-l-primary'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg">{getSentimentEmoji(conversation.sentiment)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{conversation.user.name}</div>
                      <div className="text-xs text-text-muted truncate">
                        {conversation.user.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-text-muted flex-shrink-0">
                    {conversation.timestamp}
                  </div>
                </div>

                <div className="mt-2 text-sm text-text-secondary truncate italic">
                  "{conversation.preview}"
                </div>

                <div className="mt-2">
                  <span
                    className={cn(
                      'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                      conversation.status === 'resolved' && 'bg-success/10 text-success',
                      conversation.status === 'active' && 'bg-info/10 text-info',
                      conversation.status === 'escalated' && 'bg-warning/10 text-warning'
                    )}
                  >
                    {conversation.status === 'resolved' && '✓ Resolved'}
                    {conversation.status === 'active' && '● Active'}
                    {conversation.status === 'escalated' && '⚠ Escalated'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation detail */}
        <div className="flex-1 flex flex-col h-full bg-card/10">
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-border bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{selectedConv.user.name}</h3>
                    <p className="text-sm text-text-muted">
                      {selectedConv.user.email} • {selectedConv.timestamp}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-transparent gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                    <Button variant="ghost" size="sm" className="bg-transparent gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {selectedConv?.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                    )}

                    <div
                      className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'
                        } max-w-2xl`}
                    >
                      <div
                        className={`rounded-2xl px-5 py-4 shadow-sm ${message.role === 'user'
                          ? 'bg-primary text-white rounded-tr-sm'
                          : 'bg-card border border-border rounded-tl-sm'
                          }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>

                      {message.role === 'assistant' && message.confidence && (
                        <div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-wider font-bold text-text-muted">
                          <span className={cn(
                            message.confidence > 90 ? "text-success" : message.confidence > 70 ? "text-warning" : "text-destructive"
                          )}>
                            Confidence: {message.confidence}%
                          </span>
                          {message.sources && message.sources.length > 0 && (
                            <>
                              <span className="opacity-30">•</span>
                              <span className="flex items-center gap-1.5">
                                <FileCheck className="h-3 w-3" />
                                {message.sources.join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0 shadow-md">
                        <User className="h-6 w-6 text-text-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-border bg-card">
                <div className="flex items-center gap-4">
                  <GradientButton className="text-sm">
                    Revise Answer
                  </GradientButton>
                  <Button variant="outline" className="bg-transparent text-sm">
                    Mark Resolved
                  </Button>
                  <Button variant="outline" className="bg-transparent text-sm text-warning hover:text-warning hover:bg-warning/10">
                    Escalate to Human
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted space-y-4">
              <div className="p-6 rounded-full bg-secondary/30">
                <MessageSquare className="h-12 w-12 opacity-20" />
              </div>
              <p className="font-medium">Select a conversation to view details</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
