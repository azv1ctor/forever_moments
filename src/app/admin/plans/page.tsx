// src/app/admin/plans/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, SlidersHorizontal, Tv, Download, Film, Clock, Save, Loader2 } from 'lucide-react';
import { savePlansConfig } from '@/lib/actions';
import { getPlans, type Plan, type WeddingPlan } from '@/lib/plans';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlansPage() {
    const { toast } = useToast();
    const [plans, setPlans] = useState<Record<WeddingPlan, Plan> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchPlans = async () => {
            setIsLoading(true);
            try {
                // Esta action agora deve ler do arquivo JSON ou retornar o padrão
                const initialPlans = await getPlans();
                setPlans(initialPlans);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os planos.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlans();
    }, [toast]);

    const handleFeatureChange = (planName: Plan['name'], feature: keyof Plan['features'], value: boolean | number) => {
        if (!plans) return;
        setPlans(prevPlans => ({
            ...prevPlans!,
            [planName]: {
                ...prevPlans![planName],
                features: {
                    ...prevPlans![planName].features,
                    [feature]: value,
                },
            },
        }));
    };
    
    const handlePriceChange = (planName: Plan['name'], field: 'min' | 'max', value: number) => {
        if (!plans) return;
        setPlans(prevPlans => ({
            ...prevPlans!,
            [planName]: {
                ...prevPlans![planName],
                price: {
                    ...prevPlans![planName].price,
                    [field]: value
                }
            }
        }));
    }

    const handleSave = async () => {
        if (!plans) return;
        setIsSaving(true);
        const result = await savePlansConfig(plans);

        if (result.success) {
            toast({
                title: "Planos Atualizados!",
                description: "As novas configurações dos planos foram salvas com sucesso.",
            });
        } else {
             toast({
                variant: 'destructive',
                title: "Erro ao Salvar",
                description: result.message,
            });
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-80 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-36" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-7 w-24" /><Skeleton className="h-4 w-3/4 mt-2" /></CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-6 w-1/2" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (!plans) {
        return <div>Não foi possível carregar os planos. Tente recarregar a página.</div>
    }

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Configurar Planos</h1>
                    <p className="text-muted-foreground">Gerencie os planos e os recursos disponíveis para cada um.</p>
                </div>
                 <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(plans).map((plan) => (
                    <Card key={plan.name} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                            <div className="flex items-baseline gap-2 pt-4">
                               <span className="text-3xl font-bold">R${plan.price.min}</span>
                               <span className="text-muted-foreground"> - R${plan.price.max}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            <h4 className="font-semibold">Recursos Incluídos</h4>
                            <div className="space-y-3 text-sm">
                               <div className="flex items-center justify-between">
                                    <Label htmlFor={`filters-${plan.name}`} className="flex items-center gap-2 cursor-pointer">
                                        <SlidersHorizontal className="h-4 w-4" /> Filtros de Fotos
                                    </Label>
                                    <Switch
                                        id={`filters-${plan.name}`}
                                        checked={plan.features.allowFilters}
                                        onCheckedChange={(value) => handleFeatureChange(plan.name, 'allowFilters', value)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor={`gifs-${plan.name}`} className="flex items-center gap-2 cursor-pointer">
                                        <Film className="h-4 w-4" /> Permitir GIFs/Vídeos
                                    </Label>
                                    <Switch
                                        id={`gifs-${plan.name}`}
                                        checked={plan.features.allowGifs}
                                        onCheckedChange={(value) => handleFeatureChange(plan.name, 'allowGifs', value)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor={`tv-${plan.name}`} className="flex items-center gap-2 cursor-pointer">
                                        <Tv className="h-4 w-4" /> App de Carrossel para TV
                                    </Label>
                                    <Switch
                                        id={`tv-${plan.name}`}
                                        checked={plan.features.tvCarousel}
                                        onCheckedChange={(value) => handleFeatureChange(plan.name, 'tvCarousel', value)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor={`download-${plan.name}`} className="flex items-center gap-2 cursor-pointer">
                                        <Download className="h-4 w-4" /> Permitir Download de Fotos
                                    </Label>
                                    <Switch
                                        id={`download-${plan.name}`}
                                        checked={plan.features.allowDownload}
                                        onCheckedChange={(value) => handleFeatureChange(plan.name, 'allowDownload', value)}
                                    />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor={`duration-${plan.name}`} className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Duração do Acesso (dias)
                                    </Label>
                                    <Input 
                                        id={`duration-${plan.name}`}
                                        type="number"
                                        value={plan.features.accessDurationDays}
                                        onChange={(e) => handleFeatureChange(plan.name, 'accessDurationDays', parseInt(e.target.value, 10) || 0)}
                                        placeholder="Ex: 365"
                                    />
                                     <p className="text-xs text-muted-foreground">Use 0 para acesso vitalício.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <p className="text-xs text-muted-foreground">{plan.support}</p>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
