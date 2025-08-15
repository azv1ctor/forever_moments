
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (email === 'joaovictoralvesazevedo@gmail.com' && password === '84153703cC!') {
      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para o painel de controle...',
      });
      // In a real app, you'd use a more secure session management system
      sessionStorage.setItem('adminLoggedIn', 'true');
      router.push('/admin/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description: 'E-mail ou senha incorretos. Por favor, tente novamente.',
      });
    }

    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="font-headline pt-4 text-3xl">Painel de Controle</CardTitle>
          <CardDescription>Login de Super Administrador</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu-email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full h-11 text-lg" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
