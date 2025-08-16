"use client";

import { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { getWedding } from '@/lib/actions';
import type { Wedding } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const weddingId = params.weddingId as string;
  const [isVerified, setIsVerified] = useState(false);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    const verifyGuest = async () => {
      if (!weddingId) return;

      try {
        const fetchedWedding = await getWedding(weddingId);
        if (!fetchedWedding) {
          notFound();
          return;
        }
        
        if (fetchedWedding.status !== 'Ativo') {
          setIsInactive(true);
          setIsLoading(false);
          return;
        }

        setWedding(fetchedWedding);

        const guestName = localStorage.getItem(`guestName_${weddingId}`);
        if (!guestName) {
          router.push(`/${weddingId}`);
        } else {
          setIsVerified(true);
        }
      } catch (error) {
        console.error("Failed to verify guest:", error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyGuest();
  }, [router, weddingId]);

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="space-y-4 flex flex-col items-center">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-6 w-[280px]" />
                <Skeleton className="h-4 w-[220px]" />
            </div>
        </div>
    );
  }

  if (isInactive) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-background p-4">
              <Card className="text-center">
                  <CardHeader>
                      <div className="mx-auto bg-destructive/10 p-3 rounded-full">
                        <ShieldAlert className="h-8 w-8 text-destructive"/>
                      </div>
                      <CardTitle className="mt-4">Acesso Indisponível</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground">Este evento não está mais ativo. Entre em contato com os noivos para mais informações.</p>
                  </CardContent>
              </Card>
          </div>
      );
  }
  
  if (!isVerified || !wedding) {
    // This part should ideally not be reached if logic is correct,
    // as loading is handled and redirection happens if not a guest.
    // It's a fallback.
    return null;
  }


  return (
    <div className="min-h-screen bg-background">
      <AppHeader wedding={wedding} />
      <main>{children}</main>
    </div>
  );
}
