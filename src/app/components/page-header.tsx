import { ReactNode } from 'react';
import { cn } from './ui/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-8', className)}>
      <div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {description && <p className="text-text-secondary">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
