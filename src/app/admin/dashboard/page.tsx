// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPhotos, deletePhoto } from '@/lib/actions';
import type { Photo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2, ExternalLink, ShieldAlert, Users, Settings, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple verification, a real auth system would be needed for production
    const adminLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (adminLoggedIn !== 'true') {
      router.push('/admin');
    } else {
      setIsVerified(true);
    }
  }, [router]);

  useEffect(() => {
    if (isVerified) {
      const fetchPhotos = async () => {
        setIsLoading(true);
        const fetchedPhotos = await getPhotos();
        setPhotos(fetchedPhotos);
        setIsLoading(false);
      };
      fetchPhotos();
    }
  }, [isVerified]);

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    const result = await deletePhoto(photoId, imageUrl);
    if (result.success) {
      setPhotos(photos.filter(p => p.id !== photoId));
      toast({ title: 'Sucesso!', description: 'Foto excluída permanentemente.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
  };

  if (!isVerified) {
    return <div className="flex h-screen w-full items-center justify-center bg-muted/40"><p>Verificando...</p></div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-6">
            <h1 className="text-lg font-bold font-headline">Super Admin</h1>
        </div>
        <nav className="flex flex-col gap-2 p-4">
            <Button variant="secondary" className="justify-start"><ShieldAlert className="mr-2 h-4 w-4" /> Moderação de Conteúdo</Button>
            <Button variant="ghost" className="justify-start" disabled><Users className="mr-2 h-4 w-4" /> Gerenciar Casamentos</Button>
            <Button variant="ghost" className="justify-start" disabled><Settings className="mr-2 h-4 w-4" /> Configurar Planos</Button>
            <Button variant="ghost" className="justify-start" disabled><BarChart3 className="mr-2 h-4 w-4" /> Análises</Button>
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <h1 className="text-xl font-semibold">Moderação de Conteúdo</h1>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciador de Fotos</CardTitle>
              <CardDescription>Visualize e apague fotos enviadas pelos convidados.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Carregando fotos...</p>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-[100px] sm:table-cell">Imagem</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Legenda</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead><span className="sr-only">Ações</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {photos.map((photo) => (
                    <TableRow key={photo.id}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          alt="Foto do casamento"
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={photo.imageUrl}
                          width="64"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{photo.author}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{photo.caption || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {photo.createdAt ? format(new Date(photo.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                            <a href={photo.imageUrl} target="_blank" rel="noopener noreferrer">
                                <Button size="icon" variant="outline"><ExternalLink className="h-4 w-4" /></Button>
                            </a>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Essa ação não pode ser desfeita. Isso excluirá permanentemente a foto
                                        do servidor.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePhoto(photo.id, photo.imageUrl)}>
                                        Sim, excluir foto
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
               { !isLoading && photos.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">Nenhuma foto foi enviada ainda.</p>
                </div>
               )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
