"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { getWedding } from '@/lib/actions';
import type { Wedding } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function WelcomePage() {
  const [name, setName] = useState('');
  const router = useRouter();
  const params = useParams();
  const weddingId = params.weddingId as string;
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeddingData = async () => {
      if (!weddingId) return;
      try {
        const weddingData = await getWedding(weddingId);
        if (!weddingData) {
          notFound();
          return;
        }
        setWedding(weddingData);

        // If guest is already logged in for this wedding, redirect to feed
        if (localStorage.getItem(`guestName_${weddingId}`)) {
          router.push(`/${weddingId}/feed`);
        }
      } catch (error) {
        console.error("Failed to fetch wedding data", error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };
    fetchWeddingData();
  }, [weddingId, router]);

  const handleContinue = () => {
    if (name.trim() && weddingId) {
      localStorage.setItem(`guestName_${weddingId}`, name.trim());
      router.push(`/${weddingId}/feed`);
    }
  };
  
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
            <CardHeader className="items-center text-center">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-8 w-64 mt-4" />
                <Skeleton className="h-4 w-80 mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-12 w-full" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-12 w-full" />
            </CardFooter>
        </Card>
      </main>
    )
  }

  if (!wedding) {
    // This should be caught by notFound() in useEffect, but as a fallback
    return <div>Casamento não encontrado.</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in-50 zoom-in-95">
        <CardHeader className="items-center text-center">
            {wedding.logoUrl ? (
                <Image src={wedding.logoUrl} alt={`Logo ${wedding.coupleNames}`} width={80} height={80} className="rounded-full object-cover" />
            ) : (
                <Logo />
            )}
            <CardTitle className="font-headline pt-4 text-3xl">Bem-vindo à Celebração de {wedding.coupleNames}</CardTitle>
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
