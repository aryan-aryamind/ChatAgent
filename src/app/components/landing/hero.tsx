import { ArrowRight, Sparkles } from 'lucide-react';
import { GradientButton } from '../gradient-button';
import { Button } from '../ui/button';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6366F1]/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm">Trusted by 1,000,000+ businesses worldwide</span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Build AI Chatbots
            <br />
            <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
              Trained on Your Data
            </span>
          </h1>
          
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            Just upload your documents or add a link to your website and get a ChatGPT-like chatbot 
            that can answer any question about your content.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <GradientButton size="lg" className="gap-2">
              Build your chatbot
              <ArrowRight className="h-5 w-5" />
            </GradientButton>
            <Button variant="outline" size="lg" className="bg-transparent">
              See how it works
            </Button>
          </div>
          
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              Free plan available
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              Setup in 2 minutes
            </div>
          </div>
        </div>
        
        {/* Demo illustration */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
            {/* Browser chrome */}
            <div className="bg-secondary px-4 py-3 border-b border-border flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-error" />
                <div className="w-3 h-3 rounded-full bg-warning" />
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
              <div className="flex-1 text-center text-sm text-text-muted">
                chatbase.co/demo
              </div>
            </div>
            
            {/* Chat demo */}
            <div className="p-8 min-h-[400px] bg-gradient-to-br from-background to-card">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-semibold">
                    AI
                  </div>
                  <div className="flex-1 bg-secondary rounded-2xl rounded-tl-sm p-4">
                    <p className="text-sm">Hi! I'm your AI assistant. I can answer questions about your business. What would you like to know?</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 justify-end">
                  <div className="flex-1 max-w-md bg-primary rounded-2xl rounded-tr-sm p-4">
                    <p className="text-sm text-white">What are your business hours?</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold">
                    U
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-semibold">
                    AI
                  </div>
                  <div className="flex-1 bg-secondary rounded-2xl rounded-tl-sm p-4">
                    <p className="text-sm">We're open Monday through Friday, 9 AM to 6 PM EST. We also offer 24/7 support through this chat!</p>
                    <div className="mt-2 text-xs text-text-muted">
                      Source: FAQ.pdf • Confidence: 98%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
