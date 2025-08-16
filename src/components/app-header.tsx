"use client";

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Upload, LogOut } from 'lucide-react';
import type { Wedding } from '@/lib/types';
import Image from 'next/image';

export default function AppHeader({ wedding }: { wedding: Wedding }) {
  const router = useRouter();
  const params = useParams();
  const weddingId = params.weddingId as string;

  const handleLogout = () => {
    localStorage.removeItem(`guestName_${weddingId}`);
    router.push(`/${weddingId}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${weddingId}/feed`} className="flex items-center gap-3">
          {wedding.logoUrl ? (
             <Image src={wedding.logoUrl} alt={`Logo ${wedding.coupleNames}`} width={40} height={40} className="rounded-full object-cover" />
          ) : (
             <Logo />
          )}
           <h1 className="text-xl font-bold font-headline text-foreground hidden sm:block">
            {wedding.coupleNames}
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/${weddingId}/upload`}>
              <Upload className="mr-2 h-4 w-4" />
              Enviar Foto
            </Link>
          </Button>
          <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
