import { MapPin, Phone, Mail, Sparkles } from 'lucide-react';
import { GradientButton } from '../gradient-button';
import { Button } from '../ui/button';

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm">Contact Us</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Custom Solutions for Your Business
          </h2>
          <p className="text-xl text-text-secondary">
            Since every business has unique needs, we provide tailored solutions rather than fixed prices. Reach out to us for a custom quote.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative bg-card rounded-2xl p-10 md:p-12 border border-border hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 z-10 overflow-hidden group">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8B5CF6]/5 rounded-full blur-3xl group-hover:bg-[#8B5CF6]/10 transition-all" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-4">Get in Touch</h3>
                <p className="text-text-secondary mb-8">
                  We're ready to help you implement the perfect AI support agent for your platform. Connect with us directly:
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-muted mb-1">Email</p>
                      <a href="mailto:shwetatechnologie@gmail.com" className="font-semibold text-lg hover:text-primary transition-colors break-all">
                        shwetatechnologie@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 shrink-0">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-muted mb-1">Contact</p>
                      <a href="tel:+916356137551" className="font-semibold text-lg hover:text-primary transition-colors">
                        +91 63561 37551
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 shrink-0">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-muted mb-1">Address</p>
                      <address className="not-italic font-semibold text-base leading-relaxed">
                        C-35, Tirupati Sahibag, <br />
                        Village Panchot, Mehsana, <br />
                        Gujarat, 384205
                      </address>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-xl p-8 border border-border shadow-inner">
                <h4 className="text-xl font-bold mb-4">Why Contact Us?</h4>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="text-text-secondary">Get a personalized demo of TheChatAgent trained on your data.</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="text-text-secondary">Discuss custom integrations for your unique tech stack.</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="text-text-secondary">Learn about enterprise security features and SLA guarantees.</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <GradientButton
                    className="w-full"
                    onClick={() => window.location.href = 'mailto:shwetatechnologie@gmail.com'}
                  >
                    Send us an Email
                  </GradientButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
