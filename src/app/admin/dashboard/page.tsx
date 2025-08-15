// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getPhotos, deletePhoto } from '@/lib/actions';
import type { Photo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      const fetchPhotos = async () => {
        setIsLoading(true);
        const fetchedPhotos = await getPhotos();
        setPhotos(fetchedPhotos);
        setIsLoading(false);
      };
      fetchPhotos();
  }, []);

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    const result = await deletePhoto(photoId, imageUrl);
    if (result.success) {
      setPhotos(photos.filter(p => p.id !== photoId));
      toast({ title: 'Sucesso!', description: 'Foto excluída permanentemente.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
  };

  return (
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
  );
}
