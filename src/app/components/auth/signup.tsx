import { useState } from 'react';
import { Bot, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/router';
import { Button } from '../ui/button';
import { GradientButton } from '../gradient-button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';

interface SignupProps {
  onNavigateToLogin: () => void;
}

export function Signup({ onNavigateToLogin }: SignupProps) {
  const router = useRouter();
  const { signIn: signInWithAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!formData.agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Automatically log in the user after successful registration
      toast.success('Account created successfully! Logging you in...');
      
      try {
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.error) {
          // If auto-login fails, redirect to login page
          toast.error('Account created but login failed. Please log in manually.');
          onNavigateToLogin();
        } else {
          // Successfully logged in, redirect to home
          toast.success('Welcome! Redirecting...');
          router.push('/');
        }
      } catch (loginError) {
        // If auto-login fails, redirect to login page
        toast.error('Account created but login failed. Please log in manually.');
        onNavigateToLogin();
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithAuth('google');
    } catch (error) {
      toast.error('Failed to sign in with Google');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="flex items-center justify-center gap-2 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push('/')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push('/');
              }
            }}
          >
            <div className="p-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold">Chatbase</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-text-secondary">Start building AI chatbots in minutes</p>
        </div>

        {/* Signup Form */}
        <div className="bg-card rounded-2xl p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Full name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1">Must be at least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, agreedToTerms: checked as boolean })
                }
              />
              <label htmlFor="terms" className="text-sm text-text-secondary leading-tight">
                I agree to the{' '}
                <a href="#" className="text-primary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit button */}
            <GradientButton type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </GradientButton>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-text-muted">or continue with</span>
              </div>
            </div>

            {/* Social login */}
            <Button 
              variant="outline" 
              type="button" 
              className="w-full bg-transparent"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{' '}
          <button onClick={onNavigateToLogin} className="text-primary hover:underline font-medium">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
