
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Settings, ShieldAlert, Users, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const navItems = [
  { href: '/admin/dashboard', label: 'Moderação de Conteúdo', icon: ShieldAlert },
  { href: '/admin/weddings', label: 'Gerenciar Casamentos', icon: Users },
  { href: '/admin/plans', label: 'Configurar Planos', icon: Settings },
  { href: '/admin/analytics', label: 'Análises', icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const adminLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (adminLoggedIn !== 'true') {
      router.push('/admin');
    } else {
      setIsVerified(true);
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('adminLoggedIn');
    router.push('/admin');
  };

  if (!isVerified) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-muted/40">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    );
  }
  
  const activeItem = navItems.find((item) => pathname.startsWith(item.href));

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-6">
            <h1 className="text-lg font-bold font-headline">Super Admin</h1>
        </div>
        <nav className="flex flex-col gap-2 p-4">
            {navItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
        </nav>
        <div className="mt-auto p-4">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <h1 className="text-xl font-semibold">{activeItem?.label || 'Painel'}</h1>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </div>
    </div>
  );
}
