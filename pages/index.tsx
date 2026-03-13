import { useRouter } from 'next/router'
import { Navbar } from '@/app/components/landing/navbar'
import { Hero } from '@/app/components/landing/hero'
import { Features } from '@/app/components/landing/features'
import { HowItWorks } from '@/app/components/landing/how-it-works'
import { Testimonials } from '@/app/components/landing/testimonials'
import { Pricing } from '@/app/components/landing/pricing'
import { CTA } from '@/app/components/landing/cta'
import { Footer } from '@/app/components/landing/footer'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar 
        onNavigateToLogin={() => router.push('/login')}
        onNavigateToSignup={() => router.push('/signup')}
      />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}
