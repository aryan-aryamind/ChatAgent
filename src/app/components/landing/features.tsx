import { 
  Bot, 
  FileText, 
  Zap, 
  Shield, 
  Globe, 
  BarChart3,
  MessageSquare,
  Settings,
  Sparkles,
  Webhook,
  Languages,
  Lock
} from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Chatbot',
    description: 'Train ChatGPT on your data and create custom AI chatbots in minutes.',
  },
  {
    icon: FileText,
    title: 'Multiple Data Sources',
    description: 'Upload documents, scrape websites, or paste text to train your chatbot.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast Setup',
    description: 'Get your chatbot up and running in under 2 minutes with our simple interface.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and stored securely. We never train on your data.',
  },
  {
    icon: Globe,
    title: 'Deploy Anywhere',
    description: 'Embed on your website, integrate with WhatsApp, Slack, or use our API.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Track conversations, measure performance, and improve your chatbot over time.',
  },
  {
    icon: MessageSquare,
    title: 'Conversation History',
    description: 'View all conversations, export data, and analyze user interactions.',
  },
  {
    icon: Settings,
    title: 'Fully Customizable',
    description: 'Customize appearance, behavior, and responses to match your brand.',
  },
  {
    icon: Sparkles,
    title: 'GPT-4 Powered',
    description: 'Use the latest AI models including GPT-4o, Claude, and Gemini.',
  },
  {
    icon: Webhook,
    title: 'Integrations',
    description: 'Connect with Zapier, Slack, WhatsApp, and 5000+ other tools.',
  },
  {
    icon: Languages,
    title: 'Multi-Language',
    description: 'Support for 95+ languages. Your chatbot speaks your customers\' language.',
  },
  {
    icon: Lock,
    title: 'Lead Generation',
    description: 'Collect leads, emails, and user data seamlessly during conversations.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm">Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything you need to build amazing chatbots
          </h2>
          <p className="text-xl text-text-secondary">
            Powerful features that help you create, deploy, and manage AI chatbots with ease.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 border border-border hover:border-border-emphasis transition-all group"
            >
              <div className="p-3 rounded-lg bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 w-fit mb-4 group-hover:from-[#6366F1]/20 group-hover:to-[#8B5CF6]/20 transition-all">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-text-secondary text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
