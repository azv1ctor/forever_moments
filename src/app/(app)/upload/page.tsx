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
import { createPhoto, suggestCaption } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Upload, Camera } from 'lucide-react';
import { convertHeicToJpeg } from '@/lib/heic-converter';

const uploadSchema = z.object({
  caption: z.string().max(280, 'A legenda é muito longa.').optional(),
  photo: z.any()
    .refine((file) => file, 'A imagem é obrigatória.')
    .refine((file) => file?.size <= 10000000, `O tamanho máximo do arquivo é 10MB.`),
});

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string>('');
  
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
      const result = await suggestCaption(formData);
      if (result.success && result.caption) {
        form.setValue('caption', result.caption);
        toast({ title: 'Sugestão de legenda aplicada!' });
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.message });
      }
    });
  };

  const onSubmit = (values: z.infer<typeof uploadSchema>) => {
    startTransition(async () => {
        let file = values.photo;
        if (!file) return;

        try {
            if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
              file = await convertHeicToJpeg(file);
            }
    
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                const result = await createPhoto(guestName, values.caption || '', base64data, "user uploaded");

                if (result.success) {
                    toast({ title: 'Foto enviada!', description: 'Obrigado por compartilhar seu momento.' });
                    router.push('/feed');
                } else {
                    toast({ variant: 'destructive', title: 'Falha no envio', description: 'Por favor, tente novamente.' });
                }
            }
        } catch (error) {
            console.error("Error processing file:", error);
            toast({ variant: 'destructive', title: 'Erro no processamento do arquivo', description: 'Não foi possível processar sua imagem. Tente um formato diferente.' });
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
                        <Camera className="h-12 w-12 text-muted-foreground" />
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
                <div className="w-full aspect-video relative rounded-lg overflow-hidden border">
                    <Image src={preview} alt="Pré-visualização da imagem" fill className="object-contain" />
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
