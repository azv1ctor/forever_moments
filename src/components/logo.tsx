import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Sparkles className="h-7 w-7 text-accent" />
      <h1 className="text-2xl font-bold font-headline text-foreground">
        ParaSempre
      </h1>
    </div>
  );
}
