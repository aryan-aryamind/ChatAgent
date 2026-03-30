import { Star, Sparkles } from 'lucide-react';

const testimonials = [
  {
    name: 'Rajesh Sharma',
    role: 'Founder, RetailHub India',
    avatar: 'RS',
    content: 'TheChatAgent has completely changed how we manage customer queries during festive sales. Our response time dropped from hours to seconds. The local language support is a huge plus!',
    rating: 5,
  },
  {
    name: 'Priya Desai',
    role: 'Marketing Head, EdTech Solutions',
    avatar: 'PD',
    content: 'The lead generation is phenomenal. We integrated it with our WhatsApp API and saw a 300% jump in student enrollments within the first month. Incredible ROI.',
    rating: 5,
  },
  {
    name: 'Ankit Verma',
    role: 'Operations Manager',
    avatar: 'AV',
    content: 'Setup took literally 5 minutes. Uploaded our PDF brochures and policy docs, and the bot started answering complex GST and shipping queries perfectly.',
    rating: 5,
  },
  {
    name: 'Neha Gupta',
    role: 'Customer Success Lead',
    avatar: 'NG',
    content: 'The analytics are top-notch. It helped us identify the exact pain points our users face during checkout. Very reliable and the local support team provides quick resolutions.',
    rating: 5,
  },
  {
    name: 'Vikram Singh',
    role: 'Director, Digital Infra',
    avatar: 'VS',
    content: 'We reviewed many AI solutions, but TheChatAgent\'s data privacy and secure architecture gave us the confidence to deploy it across our enterprise portals.',
    rating: 5,
  },
  {
    name: 'Meera Iyer',
    role: 'E-commerce Owner',
    avatar: 'MI',
    content: 'Our support costs dropped drastically while customer satisfaction soared. It handles 80% of routine "where is my order" questions automatically. Highly recommended.',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm">Testimonials</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Trusted by growing businesses across India
          </h2>
          <p className="text-xl text-text-secondary">
            Join thousands of businesses that trust TheChatAgent to handle their customer support and sales.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 border border-border hover:border-border-emphasis transition-all"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              
              <p className="text-text-secondary mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-semibold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-text-muted text-xs">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-8 text-text-secondary">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-warning text-warning" />
              <span className="font-semibold">4.9/5</span>
              <span className="text-sm">average rating</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="text-sm">
              <span className="font-semibold">1,000+</span> positive reviews
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
