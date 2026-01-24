import { useRouter } from 'next/router'
import { HelpCircle, Book, MessageCircle, ExternalLink } from 'lucide-react'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { PageHeader } from '@/app/components/page-header'
import { Button } from '@/app/components/ui/button'

export default function HelpPage() {
  const router = useRouter()

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
      items: [
        'Creating your first agent',
        'Adding training sources',
        'Configuring your agent',
        'Deploying your agent',
      ],
    },
    {
      title: 'Agent Management',
      items: [
        'Editing agent settings',
        'Managing data sources',
        'Viewing analytics',
        'Agent best practices',
      ],
    },
    {
      title: 'API & Integrations',
      items: [
        'API documentation',
        'Webhook setup',
        'Third-party integrations',
        'Custom integrations',
      ],
    },
    {
      title: 'Billing & Plans',
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
      
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="p-8">
          <PageHeader
            title="Help & Documentation"
            description="Find answers to common questions and learn how to use Chatbase"
          />

          <div className="mt-8 space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <Book className="h-6 w-6" />
                <span>Documentation</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <MessageCircle className="h-6 w-6" />
                <span>Contact Support</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                <ExternalLink className="h-6 w-6" />
                <span>Video Tutorials</span>
              </Button>
            </div>

            {/* Help Categories */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Browse by Topic</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {helpCategories.map((category) => (
                  <div key={category.title} className="bg-card rounded-lg border p-6">
                    <h4 className="font-semibold mb-3">{category.title}</h4>
                    <ul className="space-y-2">
                      {category.items.map((item, index) => (
                        <li key={index} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-card rounded-lg border p-6">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      {faq.question}
                    </h4>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
