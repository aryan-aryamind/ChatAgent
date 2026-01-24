import { Check, Sparkles } from 'lucide-react';
import { GradientButton } from '../gradient-button';
import { Button } from '../ui/button';

const plans = [
  {
    name: 'Hobby',
    price: '$40',
    period: '/month',
    description: 'Perfect for personal projects and small websites',
    features: [
      '2,000 message credits/month',
      '1 chatbot',
      '2,000,000 characters/chatbot',
      'Embed on unlimited websites',
      'View conversation history',
      'Basic analytics',
      'API access',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Standard',
    price: '$150',
    period: '/month',
    description: 'For growing businesses and teams',
    features: [
      '12,000 message credits/month',
      '2 chatbots',
      '11,000,000 characters/chatbot',
      'Everything in Hobby, plus:',
      'Remove "Powered by Chatbase"',
      'Advanced analytics',
      'Integrations (Slack, WhatsApp, etc.)',
      'Priority support',
      'Custom domains',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Pro',
    price: '$500',
    period: '/month',
    description: 'For large teams and enterprises',
    features: [
      '40,000 message credits/month',
      '5 chatbots',
      '11,000,000 characters/chatbot',
      'Everything in Standard, plus:',
      'GPT-4o access',
      'Advanced lead capture',
      'Custom AI models',
      'Dedicated account manager',
      'SLA guarantee',
      'Advanced security features',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm">Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-text-secondary">
            Choose the plan that's right for you. All plans include a 7-day free trial.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-card rounded-2xl p-8 border ${
                plan.popular
                  ? 'border-primary shadow-xl shadow-primary/20 scale-105'
                  : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-sm font-semibold">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-text-secondary text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-text-secondary">{plan.period}</span>
                </div>
              </div>
              
              <div className="mb-6">
                {plan.popular ? (
                  <GradientButton className="w-full">{plan.cta}</GradientButton>
                ) : (
                  <Button variant="outline" className="w-full bg-transparent">
                    {plan.cta}
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-text-secondary mb-4">
            All plans include: Unlimited websites • API access • Chat history • Email support
          </p>
          <Button variant="link" className="text-primary">
            View detailed comparison →
          </Button>
        </div>
      </div>
    </section>
  );
}
