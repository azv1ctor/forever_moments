
// src/app/admin/plans/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, SlidersHorizontal, Tv, Download, Film, Clock, Save } from 'lucide-react';
import { plans as initialPlans, type Plan } from '@/lib/plans';

export default function PlansPage() {
    const { toast } = useToast();
    const [plans, setPlans] = useState(initialPlans);
    const [isSaving, setIsSaving] = useState(false);

    const handleFeatureChange = (planName: Plan['name'], feature: keyof Plan['features'], value: boolean | number) => {
        setPlans(prevPlans => ({
            ...prevPlans,
            [planName]: {
                ...prevPlans[planName],
                features: {
                    ...prevPlans[planName].features,
                    [feature]: value,
                },
            },
        }));
    };
    
    const handlePriceChange = (planName: Plan['name'], field: 'min' | 'max', value: number) => {
        setPlans(prevPlans => ({
            ...prevPlans,
            [planName]: {
                ...prevPlans[planName],
                price: {
                    ...prevPlans[planName].price,
                    [field]: value
                }
            }
        }));
    }

    const handleSave = () => {
        setIsSaving(true);
        // Em uma aplicação real, aqui você salvaria a configuração dos planos no banco de dados.
        // Por enquanto, vamos apenas simular a ação e mostrar uma notificação.
        console.log("Saving plans configuration:", JSON.stringify(plans, null, 2));

        setTimeout(() => {
            toast({
                title: "Planos Atualizados!",
                description: "As novas configurações dos planos foram salvas com sucesso.",
            });
            setIsSaving(false);
        }, 1000);
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Configurar Planos</h1>
                    <p className="text-muted-foreground">Gerencie os planos e os recursos disponíveis para cada um.</p>
                </div>
                 <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
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
                                        onChange={(e) => handleFeatureChange(plan.name, 'accessDurationDays', parseInt(e.target.value, 10))}
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
