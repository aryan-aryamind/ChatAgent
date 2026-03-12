import { Sparkles } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] h-full p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        {/* Glowing background effect */}
        <div className="absolute -inset-10 bg-primary/20 blur-3xl rounded-full animate-pulse" />

        {/* Icon container */}
        <div className="relative bg-secondary/80 backdrop-blur-sm p-6 rounded-3xl border border-border-emphasis shadow-2xl">
          <Sparkles className="h-16 w-16 text-primary" />
        </div>

        {/* Floating elements */}
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary animate-ping" />
        <div className="absolute top-1/2 -left-6 w-2 h-2 rounded-full bg-info" />
        <div className="absolute -bottom-4 right-1/4 w-3 h-3 rounded-full bg-warning" />
      </div>

      <div className="space-y-4 max-w-lg relative">
        <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-light to-secondary-light">
          {title} is Coming Soon
        </h2>

        <p className="text-text-secondary text-lg leading-relaxed">
          {description}
        </p>

        <div className="pt-6">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-border bg-secondary/50 backdrop-blur-sm text-sm font-semibold text-text-primary shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            Development in progress
          </div>
        </div>
      </div>

      {/* Decorative background patterns */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 opacity-30">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
