import { Bot, Mail, Phone } from 'lucide-react';
import { useRouter } from 'next/router';

export function Footer() {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
          {/* Brand */}
          <div className="max-w-md">
            <div
              className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
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
            <p className="text-text-secondary mb-6">
              The ultimate AI support agent for your business. Fast, secure, and always online.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="mailto:shwetatechnologie@gmail.com"
                className="flex items-center gap-2 p-2 px-3 rounded-lg bg-secondary hover:bg-bg-hover transition-colors text-primary"
                title="Email Us"
              >
                <Mail className="h-5 w-5" />
                <span className="text-sm font-medium">Email</span>
              </a>
              <a
                href="tel:+916356137551"
                className="flex items-center gap-2 p-2 px-3 rounded-lg bg-secondary hover:bg-bg-hover transition-colors text-primary"
                title="Call Us"
              >
                <Phone className="h-5 w-5" />
                <span className="text-sm font-medium">+91 63561 37551</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-secondary text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} TheChatAgent. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-6 text-text-secondary text-sm">
            <a href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/cookie-policy" className="hover:text-foreground transition-colors">Cookie Policy</a>
            <a href="mailto:shwetatechnologie@gmail.com" className="hover:text-primary transition-colors font-medium">Contact Us</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
