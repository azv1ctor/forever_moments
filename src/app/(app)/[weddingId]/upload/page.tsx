'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Image from 'next/image';
import { createPhoto, getWedding, suggestCaptionAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Upload, Camera, SlidersHorizontal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import type { Wedding } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import heic2any from 'heic2any';
import imageCompression from 'browser-image-compression';

const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 50;
const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_SIZE = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const uploadSchema = z.object({
  caption: z.string().max(280, 'A legenda é muito longa.').optional(),
  file: z.any()
    .refine((file): file is File => file && file.size > 0, {
      message: 'O envio de um arquivo é obrigatório.',
    })
    .refine(
        (file) => {
            const isVideo = file.type.startsWith('video/');
            if (isVideo) return file.size <= MAX_VIDEO_SIZE;
            return file.size <= MAX_IMAGE_SIZE;
        },
        (file) => ({
            message: file.type.startsWith('video/')
                ? `O tamanho máximo do vídeo é ${MAX_VIDEO_SIZE_MB}MB.`
                : `O tamanho máximo da imagem é ${MAX_IMAGE_SIZE_MB}MB.`
        })
    ),
});

const imageFilters = [
    { name: 'Normal', className: 'filter-none' },
    { name: 'Sépia', className: 'filter-sepia' },
    { name: 'P&B', className: 'filter-grayscale' },
    { name: 'Contraste', className: 'filter-contrast-125' },
    { name: 'Brilho', className: 'filter-brightness-110' },
    { name: 'Saturado', className: 'filter-saturate-150' },
];

export default function UploadPage() {
  const router = useRouter();
  const params = useParams();
  const weddingId = params.weddingId as string;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [guestName, setGuestName] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState('filter-none');
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [isLoadingWedding, setIsLoadingWedding] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { caption: '' },
  });

  useEffect(() => {
    if (weddingId) {
      setGuestName(localStorage.getItem(`guestName_${weddingId}`) || '');
      getWedding(weddingId).then(data => {
        setWedding(data);
        setIsLoadingWedding(false);
      });
    }
  }, [weddingId]);

  const acceptedFileTypes = wedding?.planDetails.allowGifs
    ? "image/png, image/jpeg, image/webp, image/heic, image/heif, image/gif, video/mp4, video/quicktime, video/webm"
    : "image/png, image/jpeg, image/webp, image/heic, image/heif";

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    let file = event.target.files?.[0];
    if (!file) {
      setPreview(null);
      setIsVideo(false);
      form.resetField('file');
      return;
    }

    setIsProcessing(true);
    setPreview(null);

    try {
      const isVideoFile = file.type.startsWith('video/');
      setIsVideo(isVideoFile);

      if (!isVideoFile) {
        const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic');
        if (isHeic) {
          console.log("HEIC detectado. Convertendo para JPEG...");
          const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 }) as Blob;
          file = new File([convertedBlob], file.name.replace(/\.[^/.]+$/, ".jpeg"), { type: "image/jpeg" });
          console.log("Conversão concluída.");
        }

        console.log(`Tamanho antes da compressão: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        const options = {
          maxSizeMB: 0.95,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        console.log(`Tamanho final APÓS compressão: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
        file = compressedFile;
      }

      form.setValue('file', file);
      await form.trigger('file'); 

      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));

    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível processar seu arquivo.';
      toast({ variant: 'destructive', title: 'Erro no Processamento', description: errorMessage });
      setPreview(null);
      setIsVideo(false);
      form.resetField('file');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSuggestCaption = async () => {
    if (!preview || isVideo) {
      toast({ variant: 'destructive', title: 'Por favor, selecione uma imagem primeiro.' });
      return;
    }
    startSuggestionTransition(async () => {
        const file = form.getValues('file');
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64data = reader.result as string;
            const formData = new FormData();
            formData.append('photoDataUri', base64data);
            const result = await suggestCaptionAction(formData);
            if (result.success && result.caption) {
                form.setValue('caption', result.caption);
                toast({ title: 'Sugestão de legenda aplicada!' });
            } else {
                toast({ variant: 'destructive', title: 'Falha na Sugestão', description: result.message });
            }
        };
    });
  };
  
  const onSubmit = (values: z.infer<typeof uploadSchema>) => {
    startTransition(async () => {
        const file = values.file;
        if (!file || !weddingId) return;

        console.log(`%cTENTANDO ENVIAR ARQUIVO FINAL: Tamanho: ${(file.size / 1024 / 1024).toFixed(2)} MB, Tipo: ${file.type}`, 'color: green; font-weight: bold;');
        
        try {
          const formData = new FormData();
          formData.append('weddingId', weddingId);
          formData.append('author', guestName);
          formData.append('file', file);
          formData.append('caption', values.caption || '');
          formData.append('filter', selectedFilter);
          const result = await createPhoto(formData);
          if (result.success) {
              toast({ title: 'Mídia enviada!', description: 'Obrigado por compartilhar seu momento.' });
              router.push(`/${weddingId}/feed`);
          } else {
              toast({ variant: 'destructive', title: 'Falha no envio', description: result.message || 'Por favor, tente novamente.' });
          }
        } catch (error) {
           console.error("Error submitting form:", error);
           const errorMessage = error instanceof Error ? error.message : 'Não foi possível processar sua mídia.';
           toast({ variant: 'destructive', title: 'Erro no Envio', description: errorMessage });
        }
    });
  };

  if (isLoadingWedding) {
      return (
          <div className="container mx-auto max-w-2xl px-4 py-8">
              <Card>
                  <CardHeader>
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <Skeleton className="h-64 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-12 w-full" />
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Compartilhe um Momento</CardTitle>
          <CardDescription>Envie uma foto ou vídeo do casamento para todos verem.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => ( 
                  <FormItem>
                    <FormLabel>Foto ou Vídeo</FormLabel>
                      <div className="relative flex justify-center items-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                          {preview ? (
                              isVideo ? (
                                  <video src={preview} controls className="h-full w-full object-contain rounded-lg" />
                              ) : (
                                  <Image src={preview} alt="Pré-visualização" fill className={cn('object-contain rounded-lg', selectedFilter)} />
                              )
                          ) : isProcessing ? (
                              <div className="text-center text-muted-foreground flex flex-col items-center">
                                  <Loader2 className="h-12 w-12 mx-auto animate-spin" />
                                  <p className="mt-2">Carregando sua mídia...</p>
                              </div>
                          ) : (
                              <div className="text-center text-muted-foreground">
                                  <Camera className="h-12 w-12 mx-auto" />
                                  <p>Clique para enviar</p>
                                  <p className="text-xs mt-1">{wedding?.planDetails.allowGifs ? 'Imagens, GIFs ou Vídeos' : 'Apenas Imagens'}</p>
                              </div>
                          )}
                          <input
                              id="file-upload"
                              type="file"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              accept={acceptedFileTypes}
                              onChange={handleFileChange}
                              disabled={isProcessing}
                          />
                      </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {preview && !isVideo && wedding?.planDetails.allowFilters && (
                   <div className="space-y-2">
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <SlidersHorizontal className="h-4 w-4" />
                         <span>Filtros</span>
                     </div>
                     <Carousel opts={{ align: "start", slidesToScroll: 'auto' }} className="w-full">
                         <CarouselContent>
                             {imageFilters.map((filter) => (
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
                        disabled={!preview || isVideo || isSuggesting || isProcessing}
                        className="text-accent-foreground"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isSuggesting ? 'Pensando...' : 'Sugerir com IA'}
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea placeholder="Adicione uma legenda divertida à sua mídia..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 text-lg" disabled={isPending || !guestName || !preview || isProcessing || !form.formState.isValid}>
                {isPending ? 'Enviando...' : 'Compartilhar Momento'}
                <Upload className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}