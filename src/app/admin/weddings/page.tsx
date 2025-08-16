// src/app/admin/weddings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getWeddings, createWedding, updateWedding, deleteWedding } from '@/lib/actions';
import type { Wedding, WeddingPlan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const plans: Record<WeddingPlan, { name: WeddingPlan; min: number; max: number }> = {
  'Básico': { name: 'Básico', min: 1000, max: 1500 },
  'Premium': { name: 'Premium', min: 2000, max: 3000 },
  'Deluxe': { name: 'Deluxe', min: 4000, max: 5000 },
};

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
  const [price, setPrice] = useState<number>(plans['Básico'].min);

  useEffect(() => {
    const fetchWeddings = async () => {
      setIsLoading(true);
      const fetchedWeddings = await getWeddings();
      setWeddings(fetchedWeddings);
      setIsLoading(false);
    };
    fetchWeddings();
  }, []);

  const resetForm = () => {
    setCoupleNames('');
    setEventDate('');
    setPlan('Básico');
    setPrice(plans['Básico'].min);
    setEditingWedding(null);
  };

  const handleOpenDialog = (wedding: Wedding | null = null) => {
    if (wedding) {
      setEditingWedding(wedding);
      setCoupleNames(wedding.coupleNames);
      setEventDate(wedding.date.split('T')[0]); // Format for input type="date"
      setPlan(wedding.plan);
      setPrice(wedding.price);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este casamento? Esta ação é irreversível.')) return;
    const result = await deleteWedding(id);
    if (result.success) {
      setWeddings(weddings.filter(w => w.id !== id));
      toast({ title: 'Sucesso!', description: 'Casamento excluído.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const weddingData = {
      coupleNames,
      date: new Date(eventDate).toISOString(),
      plan,
      price,
      status: 'Ativo' as const,
    };
    
    let result;
    if (editingWedding) {
        result = await updateWedding(editingWedding.id, weddingData);
    } else {
        result = await createWedding(weddingData);
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
            <p>Carregando casamentos...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Noivos</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weddings.length > 0 ? weddings.map((wedding) => (
                  <TableRow key={wedding.id}>
                    <TableCell className="font-medium">{wedding.coupleNames}</TableCell>
                    <TableCell>{format(new Date(wedding.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{wedding.plan}</TableCell>
                    <TableCell>R$ {wedding.price.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{wedding.status}</TableCell>
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
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(wedding.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                </DropdownMenuItem>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <Label htmlFor="coupleNames" className="text-right">Noivos</Label>
                <Input id="coupleNames" value={coupleNames} onChange={(e) => setCoupleNames(e.target.value)} className="col-span-3" placeholder="Ex: João & Maria" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="eventDate" className="text-right">Data</Label>
                <Input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="plan" className="text-right">Plano</Label>
                <Select value={plan} onValueChange={(value: WeddingPlan) => {
                  setPlan(value);
                  setPrice(plans[value].min);
                }}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(plans).map(p => (
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
                  min={plans[plan].min}
                  max={plans[plan].max}
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
