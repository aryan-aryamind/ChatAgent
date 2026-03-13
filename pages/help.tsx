import { useState } from 'react'
import { useRouter } from 'next/router'
import { 
  HelpCircle, 
  Book, 
  MessageCircle, 
  ExternalLink, 
  Bot, 
  Search, 
  ChevronRight, 
  Terminal, 
  CreditCard, 
  Shield, 
  Zap,
  PlayCircle
} from 'lucide-react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { PageHeader } from '@/app/components/page-header'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { useChat } from '@/contexts/ChatContext'

export default function HelpPage() {
  const router = useRouter()
  const { openChat } = useChat()
  const [searchQuery, setSearchQuery] = useState('')

  const handleNavigate = (page: string) => {
    if (page === 'dashboard') {
      router.push('/dashboard')
    } else if (page === 'profile') {
      router.push('/profile')
    } else if (page === 'agents') {
      router.push('/agents')
    } else {
      router.push(`/${page}`)
    }
  }

  const helpCategories = [
    {
      title: 'Getting Started',
      icon: PlayCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      items: [
        'Creating your first agent',
        'Adding training sources',
        'Configuring your agent',
        'Deploying your agent',
      ],
    },
    {
      title: 'Agent Management',
      icon: Bot,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      items: [
        'Editing agent settings',
        'Managing data sources',
        'Viewing analytics',
        'Agent best practices',
      ],
    },
    {
      title: 'API & Integrations',
      icon: Terminal,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      items: [
        'API documentation',
        'Webhook setup',
        'Third-party integrations',
        'Custom integrations',
      ],
    },
    {
      title: 'Billing & Plans',
      icon: CreditCard,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      items: [
        'Understanding credits',
        'Upgrading your plan',
        'Billing questions',
        'Cancellation policy',
      ],
    },
  ]

  const faqs = [
    {
      question: 'How do I create my first AI agent?',
      answer: 'Click on "New AI agent" button, follow the step-by-step process to add training sources, configure the model, and deploy.',
    },
    {
      question: 'What types of data sources are supported?',
      answer: 'You can add files, text, links, Q&A pairs, and Notion pages as training sources for your agent.',
    },
    {
      question: 'How are credits calculated?',
      answer: 'Credits are consumed based on the number of messages processed by your agents. Each message typically costs 1 credit.',
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage="help" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-y-auto scrollbar-hide">
        <div className="p-8 max-w-6xl mx-auto pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <PageHeader
              title="Help & Documentation"
              description="Learn how to build, train, and deploy your AI agents"
            />
            
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for articles, guides..."
                className="pl-10 h-12 bg-card border-primary/10 shadow-sm focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-12">
            {/* Premium Agent Creation Guide */}
            <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl border border-primary/20 p-8 shadow-xl shadow-primary/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary to-primary/10" />
              <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-primary/10">
                      <Bot className="h-6 w-6 text-primary" />
                    </span>
                    Agent Creation Guide
                  </h3>
                  <p className="text-sm text-text-muted mt-1">Get your first AI agent up and running in minutes</p>
                </div>
                <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                  Watch Video Tutorial
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                {[
                  { step: '01', title: 'Create', desc: 'Initialize your agent with a name and unique identity.', icon: PlayCircle },
                  { step: '02', title: 'Train', desc: 'Feed your agent data via files, links, or text.', icon: Book },
                  { step: '03', title: 'Configure', desc: 'Refine personality and core system instructions.', icon: Terminal },
                  { step: '04', title: 'Deploy', desc: 'Go live on your website or share with a direct link.', icon: ExternalLink }
                ].map((s, idx) => (
                  <div key={s.step} className="group relative">
                    {idx < 3 && (
                      <div className="hidden md:block absolute top-6 left-full w-full h-[2px] bg-gradient-to-r from-primary/30 to-transparent -ml-8 pointer-events-none" />
                    )}
                    <div className="relative mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                        {s.step}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-lg border border-border shadow-sm">
                        <s.icon className="h-3 w-3 text-primary" />
                      </div>
                    </div>
                    <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{s.title}</h4>
                    <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Full Documentation', icon: Book, desc: 'Detailed guides for all features', link: '#' },
                { title: 'API Reference', icon: Terminal, desc: 'Integrate agents into your apps', link: '#' },
                { title: 'Community Support', icon: MessageCircle, desc: 'Join our developer community', link: '#' }
              ].map((action) => (
                <button 
                  key={action.title} 
                  className="flex items-start text-left p-6 bg-card rounded-2xl border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group"
                >
                  <div className="p-3 rounded-xl bg-secondary/50 group-hover:bg-primary/10 transition-colors mr-4">
                    <action.icon className="h-6 w-6 text-text-muted group-hover:text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold group-hover:text-primary transition-colors">{action.title}</h4>
                    <p className="text-xs text-text-muted mt-1">{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Browse by Topic */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">Browse by Topic</h3>
                <Button variant="link" className="text-primary p-0 h-auto">View all topics <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {helpCategories.map((category) => (
                  <div key={category.title} className="bg-card rounded-2xl border border-border/50 p-6 hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 rounded-xl ${category.bgColor} flex items-center justify-center mb-4`}>
                      <category.icon className={`h-5 w-5 ${category.color}`} />
                    </div>
                    <h4 className="font-bold mb-4">{category.title}</h4>
                    <ul className="space-y-3">
                      {category.items.map((item, index) => (
                        <li key={index} className="flex items-center text-sm text-text-muted hover:text-primary cursor-pointer group">
                          <ChevronRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium FAQ Section */}
            <div className="bg-secondary/20 rounded-3xl p-8 border border-border/30">
              <h3 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-card rounded-2xl border border-border/50 p-6 hover:border-primary/30 transition-colors group">
                    <h4 className="font-bold mb-3 flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      {faq.question}
                    </h4>
                    <p className="text-sm text-text-muted pl-8 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
              <div className="mt-12 text-center">
                <p className="text-sm text-text-muted mb-4">Can't find what you're looking for?</p>
                <Button 
                  onClick={openChat}
                  className="rounded-full px-8 bg-primary text-white hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat with our Support Agent
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
