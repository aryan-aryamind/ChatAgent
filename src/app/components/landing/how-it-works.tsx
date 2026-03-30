import { Upload, Brain, Rocket, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Your Data',
    description: 'Upload documents, add website URLs, or paste text. Support for PDFs, Word docs, websites, and more.',
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI Learns Your Content',
    description: 'Our AI processes your data and creates a knowledge base. Takes just a few seconds to train.',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Deploy Everywhere',
    description: 'Embed the chatbot on your website, integrate with messaging apps, or use the API.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm">How it Works</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Build your chatbot in 3 simple steps
          </h2>
          <p className="text-xl text-text-secondary">
            No coding required. Get your AI chatbot live in minutes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
          
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-center relative z-10 group">
                {/* Step number badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg border-4 border-background">
                  {index + 1}
                </div>
                
                <div className="mt-4 mb-6 flex justify-center">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10">
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-text-secondary">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary border border-border">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm">Average setup time: 2 minutes</span>
          </div>
        </div>
      </div>
    </section>
  );
}
