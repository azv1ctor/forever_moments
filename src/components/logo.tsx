import { Sparkles } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className="h-7 w-7 text-accent" />
      <h1 className="text-2xl font-bold font-headline text-foreground">
        Forever Moments
      </h1>
    </div>
  );
}
