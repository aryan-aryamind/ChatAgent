import { Star, Sparkles } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'CEO at TechStart',
    avatar: 'SJ',
    content: 'Chatbase has transformed how we handle customer support. Our response time went from hours to seconds, and customer satisfaction is through the roof!',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Marketing Director',
    avatar: 'MC',
    content: 'The lead generation features are incredible. We\'ve captured 300% more leads since implementing Chatbase on our website. Highly recommend!',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Founder of ShopWise',
    avatar: 'ER',
    content: 'Setup was literally 2 minutes. I uploaded our FAQs and product docs, and the chatbot was answering questions accurately right away. Amazing!',
    rating: 5,
  },
  {
    name: 'David Park',
    role: 'Head of Support',
    avatar: 'DP',
    content: 'The analytics dashboard is fantastic. We can see exactly what customers are asking about and improve our documentation based on real data.',
    rating: 5,
  },
  {
    name: 'Jessica Williams',
    role: 'Product Manager',
    avatar: 'JW',
    content: 'Integration with our existing tools was seamless. The API is well-documented and the team is super responsive to questions.',
    rating: 5,
  },
  {
    name: 'Alex Thompson',
    role: 'E-commerce Owner',
    avatar: 'AT',
    content: 'Our customer support costs dropped by 60% while satisfaction scores increased. The ROI is undeniable. Best investment we\'ve made this year.',
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
            Loved by businesses worldwide
          </h2>
          <p className="text-xl text-text-secondary">
            Join 1,000,000+ businesses that trust Chatbase for their AI chatbot needs.
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
              <span className="font-semibold">50,000+</span> reviews
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
