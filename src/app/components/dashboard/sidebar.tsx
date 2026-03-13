import {
  Bot,
  Home,
  MessageSquare,
  BarChart3,
  Settings,
  CreditCard,
  Key,
  HelpCircle,
  ChevronDown,
  Plus,
  Plug,
  User,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { GradientButton } from '../gradient-button';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'agents', icon: Bot, label: 'AI Agents' },
    { id: 'activity', icon: MessageSquare, label: 'Activity', isComingSoon: true },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', isComingSoon: true },
  ];

  const settingsItems = [
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'billing', icon: CreditCard, label: 'Usage & Billing' },
    { id: 'api-keys', icon: Key, label: 'API Keys', isComingSoon: true },
    { id: 'help', icon: HelpCircle, label: 'Help & Docs' },
  ];

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get user initials for avatar
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || 'user@example.com';
  const initials = getInitials(user?.name, user?.email);

  return (
    <aside className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
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
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold">Chatbase</span>
        </div>

        {/* Workspace selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-sidebar-accent border-sidebar-border h-auto py-2 px-3"
            >
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Workspace</span>
                <span className="text-sm font-semibold truncate w-full">
                  {user?.name ? `${user.name.split(' ')[0]}'s Space` : 'My Workspace'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem>My Workspace</DropdownMenuItem>
            <DropdownMenuItem>Team Workspace</DropdownMenuItem>
            <DropdownMenuItem>
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-3 overflow-y-auto font-geist">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                currentPage === item.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.isComingSoon && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="my-4 border-t border-sidebar-border" />

        <div className="space-y-1">
          {settingsItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                currentPage === item.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Usage stats */}
      {/* Usage stats - Hidden for now as it's hardcoded */}
      {/* 
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-3 mb-3">
          <div className="mt-8">
            <div className="bg-card rounded-xl border border-border p-12 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-2xl font-bold">Billing & Usage</h3>
                <p className="text-muted-foreground">
                  Our billing system is currently being updated to provide a better experience.
                </p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-6 max-w-lg mx-auto border border-border">
                <p className="text-sm font-medium mb-2 uppercase tracking-wider text-text-muted">Contact Support</p>
                <p className="text-lg">
                  For billing inquiries, usage increases, or enterprise plans, please email us at:
                </p>
                <a 
                  href="mailto:billing@chatbase.com" 
                  className="text-xl font-bold text-primary hover:underline block mt-2"
                >
                  billing@chatbase.com
                </a>
              </div>
            </div>
          </div>
        </div>
        <GradientButton size="sm" className="w-full">
          Upgrade Plan
        </GradientButton>
      </div>
      */}

      {user?.plan === 'FREE' && (
        <div className="p-4 border-t border-sidebar-border">
          <GradientButton size="sm" className="w-full" onClick={() => onNavigate('billing')}>
            Upgrade Plan
          </GradientButton>
        </div>
      )}

      {/* User profile */}
      <div className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 hover:bg-sidebar-accent p-2 rounded-lg transition-colors">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-sm font-semibold">
                  {initials}
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium break-words">{displayName}</div>
                <div className="text-xs text-text-muted break-words">{displayEmail}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-text-muted flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[200px] max-w-[300px] w-auto" align="end">
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive whitespace-normal break-words">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
