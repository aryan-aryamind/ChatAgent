import { ArrowRight } from 'lucide-react';
import { GradientButton } from '../gradient-button';

export function CTA() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] p-12 md:p-16 text-center">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to build your AI chatbot?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join 1,000,000+ businesses using Chatbase. Start your free trial today – no credit card required.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <GradientButton
                variant="secondary"
                size="lg"
                className="bg-white text-[#6366F1] hover:bg-white/90 gap-2"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </GradientButton>
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" />
                7-day free trial
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
