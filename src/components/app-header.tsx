"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Upload, LogOut } from 'lucide-react';

export default function AppHeader() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('guestName');
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/feed">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </Link>
          </Button>
          <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
