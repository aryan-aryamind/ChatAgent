import { Bot, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../ui/button';
import { GradientButton } from '../gradient-button';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  onNavigateToLogin?: () => void;
  onNavigateToSignup?: () => void;
}

export function Navbar({ onNavigateToLogin, onNavigateToSignup }: NavbarProps = {}) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  const handleSignUpClick = () => {
    router.push('/signup');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLogoClick();
              }
            }}
          >
            <div className="p-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">TheChatAgent</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-text-secondary hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-text-secondary hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#pricing" className="text-text-secondary hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-text-secondary hover:text-foreground transition-colors">
              Testimonials
            </a>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-24 h-10" />
            ) : isAuthenticated ? (
              <GradientButton onClick={handleDashboardClick}>Dashboard</GradientButton>
            ) : (
              <GradientButton onClick={handleSignUpClick}>Sign Up</GradientButton>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            <a href="#features" className="block py-2 text-text-secondary hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="block py-2 text-text-secondary hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#pricing" className="block py-2 text-text-secondary hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="block py-2 text-text-secondary hover:text-foreground transition-colors">
              Testimonials
            </a>
            <div className="pt-3 border-t border-border space-y-2">
              {loading ? (
                <div className="h-10" />
              ) : isAuthenticated ? (
                <GradientButton className="w-full" onClick={handleDashboardClick}>
                  Dashboard
                </GradientButton>
              ) : (
                <GradientButton className="w-full" onClick={handleSignUpClick}>
                  Sign Up
                </GradientButton>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}