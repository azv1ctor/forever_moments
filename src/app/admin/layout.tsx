
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { BarChart3, Settings, ShieldAlert, Users, LogOut, PanelLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';

const navItems = [
  { href: '/admin/dashboard', label: 'Moderação', icon: ShieldAlert },
  { href: '/admin/weddings', label: 'Casamentos', icon: Users },
  { href: '/admin/plans', label: 'Planos', icon: Settings },
  { href: '/admin/analytics', label: 'Análises', icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isVerified, setIsVerified] = useState(false);

    const isLoginPage = pathname === '/admin';

    useEffect(() => {
        const adminLoggedIn = sessionStorage.getItem('adminLoggedIn');
        if (!adminLoggedIn && !isLoginPage) {
            router.push('/admin');
        } else if (adminLoggedIn && isLoginPage) {
            router.push('/admin/dashboard');
        }
        else {
            setIsVerified(true);
        }
    }, [router, isLoginPage]);

    const handleLogout = () => {
        sessionStorage.removeItem('adminLoggedIn');
        router.push('/admin');
    };
    
    if (isLoginPage) {
        return <>{children}</>;
    }

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

    const NavContent = () => (
      <>
        <nav className="grid items-start gap-2 px-4 text-sm font-medium">
          {navItems.map((item) => (
          <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                pathname.startsWith(item.href) && 'bg-muted text-primary'
              )}
          >
              <item.icon className="h-4 w-4" />
              {item.label}
          </Link>
          ))}
        </nav>
        <div className="mt-auto p-4">
           <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
            </Button>
        </div>
      </>
    );

    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
          <div className="flex h-16 items-center border-b px-6">
             <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                <Logo />
             </Link>
          </div>
          <div className="flex flex-1 flex-col overflow-auto py-2">
            <NavContent />
          </div>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                 <Sheet>
                    <SheetTrigger asChild>
                      <Button size="icon" variant="outline" className="sm:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="sm:max-w-xs flex flex-col">
                       <div className="flex h-16 items-center border-b px-6">
                         <Link href="/admin/dashboard">
                            <Logo />
                         </Link>
                       </div>
                       <div className="flex flex-1 flex-col overflow-auto py-2">
                          <NavContent />
                       </div>
                    </SheetContent>
                  </Sheet>
                <h1 className="text-xl font-semibold sm:text-2xl">{activeItem?.label || 'Painel'}</h1>
            </header>
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                {children}
            </main>
        </div>
      </div>
    );
}
