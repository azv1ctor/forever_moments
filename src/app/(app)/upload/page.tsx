
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Image from 'next/image';
import { createPhoto, suggestCaptionAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Upload, Camera, SlidersHorizontal } from 'lucide-react';
import { convertHeicToJpeg } from '@/lib/heic-converter';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const uploadSchema = z.object({
  caption: z.string().max(280, 'A legenda é muito longa.').optional(),
  photo: z.any()
    .refine((file) => file, 'A imagem é obrigatória.')
    .refine((file) => file?.size <= 10000000, `O tamanho máximo do arquivo é 10MB.`),
});

const filters = [
    { name: 'Normal', className: 'filter-none' },
    { name: 'Sépia', className: 'filter-sepia' },
    { name: 'P&B', className: 'filter-grayscale' },
    { name: 'Contraste', className: 'filter-contrast-125' },
    { name: 'Brilho', className: 'filter-brightness-110' },
    { name: 'Saturado', className: 'filter-saturate-150' },
];

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState('filter-none');
  
  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { caption: '' },
  });

  useEffect(() => {
    setGuestName(localStorage.getItem('guestName') || '');
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('photo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        setPreview(null);
        form.setValue('photo', null);
    }
  };

  const handleSuggestCaption = async () => {
    if (!preview) {
      toast({ variant: 'destructive', title: 'Por favor, selecione uma imagem primeiro.' });
      return;
    }

    startSuggestionTransition(async () => {
      const formData = new FormData();
      formData.append('photoDataUri', preview);
      const result = await suggestCaptionAction(formData);
      if (result.success && result.caption) {
        form.setValue('caption', result.caption);
        toast({ title: 'Sugestão de legenda aplicada!' });
      } else {
        toast({ variant: 'destructive', title: 'Falha na Sugestão', description: result.message });
      }
    });
  };

  const processAndSubmit = async (file: File, values: z.infer<typeof uploadSchema>) => {
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64data = reader.result as string;
            const result = await createPhoto({
                author: guestName,
                caption: values.caption || '',
                base64data: base64data,
                aiHint: "user uploaded",
                filter: selectedFilter
            });

            if (result.success) {
                toast({ title: 'Foto enviada!', description: 'Obrigado por compartilhar seu momento.' });
                router.push('/feed');
            } else {
                toast({ variant: 'destructive', title: 'Falha no envio', description: result.message || 'Por favor, tente novamente.' });
            }
        }
        reader.onerror = () => {
             toast({ variant: 'destructive', title: 'Erro de Leitura', description: 'Não foi possível ler o arquivo da imagem.' });
        }
    } catch (error) {
        console.error("Error processing file:", error);
        const errorMessage = error instanceof Error ? error.message : 'Não foi possível processar sua imagem. Tente um formato diferente.';
        toast({ variant: 'destructive', title: 'Erro no processamento do arquivo', description: errorMessage });
    }
  };

  const onSubmit = (values: z.infer<typeof uploadSchema>) => {
    startTransition(async () => {
        let file = values.photo;
        if (!file) return;
        
        const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic');

        if (isHeic) {
          try {
            const convertedFile = await convertHeicToJpeg(file);
            processAndSubmit(convertedFile, values);
          } catch (error) {
             console.error("Error converting HEIC:", error);
             const errorMessage = error instanceof Error ? error.message : 'Não foi possível converter a imagem HEIC. Tente outro formato.';
             toast({ variant: 'destructive', title: 'Erro na conversão', description: errorMessage });
          }
        } else {
            processAndSubmit(file, values);
        }
    });
  };
  
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Compartilhe uma Foto</CardTitle>
          <CardDescription>Envie uma foto do casamento para todos verem.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="photo"
                render={() => (
                  <FormItem>
                    <FormLabel>Foto</FormLabel>
                     <div className="relative flex justify-center items-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                        {preview ? (
                           <Image src={preview} alt="Pré-visualização" fill className={cn('object-contain rounded-lg', selectedFilter)} />
                        ) : (
                           <Camera className="h-12 w-12 text-muted-foreground" />
                        )}
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/png, image/jpeg, image/webp, image/heic, image/heif"
                            onChange={handleFileChange}
                        />
                     </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {preview && (
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <SlidersHorizontal className="h-4 w-4" />
                        <span>Filtros</span>
                    </div>
                    <Carousel opts={{ align: "start", slidesToScroll: 'auto' }} className="w-full">
                        <CarouselContent>
                            {filters.map((filter) => (
                                <CarouselItem key={filter.name} className="basis-1/4 sm:basis-1/5">
                                    <div className="p-1">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFilter(filter.className)}
                                            className={cn(
                                                'w-full flex flex-col items-center gap-1.5 rounded-lg p-2 border-2',
                                                selectedFilter === filter.className ? 'border-primary' : 'border-transparent'
                                            )}
                                        >
                                            <div className="w-16 h-16 rounded-md overflow-hidden relative">
                                                <Image src={preview} alt={filter.name} fill className={cn('object-cover', filter.className)} />
                                            </div>
                                            <span className="text-xs font-medium">{filter.name}</span>
                                        </button>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden sm:flex" />
                        <CarouselNext className="hidden sm:flex" />
                    </Carousel>
                 </div>
              )}

              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Legenda (Opcional)</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSuggestCaption}
                        disabled={!preview || isSuggesting}
                        className="text-accent-foreground"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isSuggesting ? 'Pensando...' : 'Sugerir com IA'}
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea placeholder="Adicione uma legenda divertida à sua foto..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 text-lg" disabled={isPending || !guestName || !preview}>
                {isPending ? 'Enviando...' : 'Compartilhar Minha Foto'}
                <Upload className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
