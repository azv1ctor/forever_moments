"use client";

import { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { getWedding } from '@/lib/actions';
import type { Wedding } from '@/lib/types';

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

  useEffect(() => {
    const verifyGuest = async () => {
      if (!weddingId) return;

      try {
        const fetchedWedding = await getWedding(weddingId);
        if (!fetchedWedding) {
          notFound();
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
      }
    };
    
    verifyGuest();
  }, [router, weddingId]);

  if (!isVerified || !wedding) {
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader wedding={wedding} />
      <main>{children}</main>
    </div>
  );
}
