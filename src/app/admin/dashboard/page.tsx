// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getWeddings, deletePhoto } from '@/lib/actions';
import type { Photo, Wedding } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState<string | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      const fetchInitialData = async () => {
        setIsLoading(true);
        const fetchedWeddings = await getWeddings();
        setWeddings(fetchedWeddings);
        // Fetch all photos initially
        const allFetchedPhotos = await Promise.all(fetchedWeddings.map(w => getPhotos(w.id)));
        setAllPhotos(allFetchedPhotos.flat().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setIsLoading(false);
      };
      fetchInitialData();
  }, []);

  const handleDeletePhoto = async (photoId: string, weddingId: string, imageUrl: string) => {
    const result = await deletePhoto(photoId, weddingId, imageUrl);
    if (result.success) {
      setAllPhotos(allPhotos.filter(p => p.id !== photoId));
      toast({ title: 'Sucesso!', description: 'Foto excluída permanentemente.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
  };

  const filteredPhotos = selectedWeddingId === 'all' 
    ? allPhotos 
    : allPhotos.filter(p => p.weddingId === selectedWeddingId);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Gerenciador de Fotos</CardTitle>
                <CardDescription>Visualize e apague fotos enviadas pelos convidados.</CardDescription>
            </div>
            <Select value={selectedWeddingId} onValueChange={setSelectedWeddingId}>
                <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Filtrar por casamento..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Casamentos</SelectItem>
                    {weddings.map(wedding => (
                        <SelectItem key={wedding.id} value={wedding.id}>
                            {wedding.coupleNames}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
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
            {filteredPhotos.map((photo) => (
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
                              <AlertDialogAction onClick={() => handleDeletePhoto(photo.id, photo.weddingId, photo.imageUrl)}>
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
          { !isLoading && filteredPhotos.length === 0 && (
          <div className="text-center py-10">
              <p className="text-muted-foreground">Nenhuma foto foi enviada ainda {selectedWeddingId !== 'all' ? 'para este casamento' : ''}.</p>
          </div>
          )}
      </CardContent>
    </Card>
  );
}
