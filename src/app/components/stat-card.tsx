import { LucideIcon } from 'lucide-react';
import { cn } from './ui/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ icon: Icon, label, value, change, trend, className }: StatCardProps) {
  const getTrendColor = () => {
    if (!trend) return '';
    return trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-text-secondary';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';
  };

  return (
    <div className={cn('bg-card rounded-xl p-6 border border-border', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-secondary">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {change && (
          <span className={cn('text-sm font-medium', getTrendColor())}>
            {change} {getTrendIcon()}
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm text-text-secondary">{label}</div>
      </div>
    </div>
  );
}
