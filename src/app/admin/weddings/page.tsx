
// src/app/admin/weddings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getWeddings, createWedding, updateWedding, deleteWedding } from '@/lib/actions';
import type { Wedding, WeddingPlan, WeddingStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, PlusCircle, Trash2, Edit, Link as LinkIcon, Clipboard, Power, PowerOff, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { plans as planConfig } from '@/lib/plans';
import { Skeleton } from '@/components/ui/skeleton';

export default function WeddingsPage() {
  const { toast } = useToast();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWedding, setEditingWedding] = useState<Wedding | null>(null);

  // Form state
  const [coupleNames, setCoupleNames] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [plan, setPlan] = useState<WeddingPlan>('Básico');
  const [price, setPrice] = useState<number>(planConfig['Básico'].price.min);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeddings = async () => {
      setIsLoading(true);
      const fetchedWeddings = await getWeddings();
      setWeddings(fetchedWeddings);
      setIsLoading(false);
    };
    fetchWeddings();
  }, []);

  useEffect(() => {
      if (plan) {
          setPrice(planConfig[plan].price.min);
      }
  }, [plan]);

  const resetForm = () => {
    setCoupleNames('');
    setEventDate('');
    setPlan('Básico');
    setPrice(planConfig['Básico'].price.min);
    setEditingWedding(null);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenDialog = (wedding: Wedding | null = null) => {
    resetForm();
    if (wedding) {
      setEditingWedding(wedding);
      setCoupleNames(wedding.coupleNames);
      setEventDate(wedding.date.split('T')[0]);
      setPlan(wedding.plan);
      setPrice(wedding.price);
      setLogoPreview(wedding.logoUrl || null);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteWedding(id);
    if (result.success) {
      setWeddings(weddings.filter(w => w.id !== id));
      toast({ title: 'Sucesso!', description: 'Casamento excluído.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
  };

  const handleToggleStatus = async (wedding: Wedding) => {
      const newStatus: WeddingStatus = wedding.status === 'Ativo' ? 'Inativo' : 'Ativo';
      const formData = new FormData();
      formData.append('status', newStatus);

      const result = await updateWedding(wedding.id, formData);
      if (result.success && result.wedding) {
          setWeddings(weddings.map(w => w.id === wedding.id ? result.wedding! : w));
          toast({ title: 'Sucesso!', description: `Casamento ${newStatus.toLowerCase()}.` });
      } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.message });
      }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/${id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Copiado!', description: 'URL do casamento copiada para a área de transferência.' });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('coupleNames', coupleNames);
    formData.append('date', new Date(eventDate).toISOString());
    formData.append('plan', plan);
    formData.append('price', String(price));
    formData.append('status', editingWedding?.status || 'Ativo');
    
    if (logoFile) {
        formData.append('logo', logoFile);
    }
    
    let result;
    if (editingWedding) {
        result = await updateWedding(editingWedding.id, formData);
    } else {
        result = await createWedding(formData);
    }

    if (result.success && result.wedding) {
        if(editingWedding) {
            setWeddings(weddings.map(w => w.id === editingWedding.id ? result.wedding! : w));
        } else {
            setWeddings([result.wedding, ...weddings]);
        }
      toast({ title: 'Sucesso!', description: `Casamento ${editingWedding ? 'atualizado' : 'criado'}.` });
      setIsDialogOpen(false);
      resetForm();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gerenciar Casamentos</CardTitle>
              <CardDescription>Adicione, edite ou remova eventos de casamento.</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Casamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                         <Skeleton className="h-4 w-1/4 hidden sm:block" />
                         <Skeleton className="h-6 w-16 hidden md:block" />
                         <Skeleton className="h-8 w-20" />
                    </div>
                ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Noivos</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead className="hidden md:table-cell">Plano</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weddings.length > 0 ? weddings.map((wedding) => (
                  <TableRow key={wedding.id}>
                    <TableCell className="font-medium flex items-center gap-3">
                      {wedding.logoUrl ? <Image src={wedding.logoUrl} alt={`Logo ${wedding.coupleNames}`} width={40} height={40} className="rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-muted" />}
                      <span>{wedding.coupleNames}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{format(new Date(wedding.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="hidden md:table-cell">{wedding.plan}</TableCell>
                     <TableCell className="hidden md:table-cell">
                        <Badge variant={wedding.status === 'Ativo' ? 'default' : 'secondary'}
                           className={cn(wedding.status === 'Ativo' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600', 'text-white')}>
                          {wedding.status}
                        </Badge>
                     </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(wedding.id)}>
                        <Clipboard className="mr-2 h-4 w-4" />
                        Copiar URL
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenDialog(wedding)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleToggleStatus(wedding)}>
                                    {wedding.status === 'Ativo' ? (
                                        <><PowerOff className="mr-2 h-4 w-4" />Desativar</>
                                    ) : (
                                        <><Power className="mr-2 h-4 w-4" />Ativar</>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/${wedding.id}/feed`} target="_blank">
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    Ver Feed
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Essa ação não pode ser desfeita. Isso excluirá permanentemente o casamento, sua logo e todas as suas fotos e vídeos.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(wedding.id)} className="bg-destructive hover:bg-destructive/90">
                                                Sim, excluir casamento
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            Nenhum casamento encontrado.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) {
              resetForm();
          }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingWedding ? 'Editar Casamento' : 'Adicionar Casamento'}</DialogTitle>
              <DialogDescription>
                Preencha os detalhes do evento abaixo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="logo" className="text-right">Logo</Label>
                <div className="col-span-3 flex items-center gap-4">
                    {logoPreview ? <Image src={logoPreview} alt="Preview da logo" width={64} height={64} className="rounded-md object-cover" /> : <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center text-muted-foreground"><Camera className="h-6 w-6"/></div>}
                    <Input id="logo" type="file" onChange={handleLogoChange} className="col-span-3" accept="image/png, image/jpeg, image/gif, image/webp" />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="coupleNames" className="text-right">Noivos</Label>
                <Input id="coupleNames" value={coupleNames} onChange={(e) => setCoupleNames(e.target.value)} className="col-span-3" placeholder="Ex: João & Maria" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="eventDate" className="text-right">Data</Label>
                <Input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="plan" className="text-right">Plano</Label>
                <Select value={plan} onValueChange={(value: WeddingPlan) => setPlan(value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(planConfig).map(p => (
                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Valor (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="col-span-3"
                  min={planConfig[plan].price.min}
                  max={planConfig[plan].price.max}
                  step="100"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
