"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';

export default function WelcomePage() {
  const [name, setName] = useState('');
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (localStorage.getItem('guestName')) {
      router.push('/feed');
    }
  }, [router]);

  const handleContinue = () => {
    if (name.trim()) {
      localStorage.setItem('guestName', name.trim());
      router.push('/feed');
    }
  };
  
  if (!isMounted) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in-50 zoom-in-95">
        <CardHeader className="items-center text-center">
            <Logo />
            <CardTitle className="font-headline pt-4 text-3xl">Bem-vindo à Nossa Celebração</CardTitle>
            <CardDescription>Digite seu nome para se juntar à festa e compartilhar suas fotos!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="name"
                  placeholder="Seu Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Seu Nome"
                  required
                  className="h-12 text-center text-lg"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} className="w-full h-12 text-lg" disabled={!name.trim()}>
            Ver Feed de Fotos
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
