'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Image from 'next/image';
import { createPhoto, suggestCaption } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Upload } from 'lucide-react';

const uploadSchema = z.object({
  caption: z.string().max(280, 'A legenda é muito longa.').optional(),
  photo: z.any()
    .refine((files) => files?.length == 1, 'A imagem é obrigatória.')
    .refine((files) => files?.[0]?.size <= 5000000, `O tamanho máximo do arquivo é 5MB.`)
    .refine(
      (files) => ["image/jpeg", "image/png", "image/webp"].includes(files?.[0]?.type),
      "São aceitos arquivos .jpg, .png e .webp."
    ),
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        setPreview(null);
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
      if (!preview) return;
      const result = await createPhoto(guestName, values.caption || '', preview, "user uploaded");

      if (result.success) {
        toast({ title: 'Foto enviada!', description: 'Obrigado por compartilhar seu momento.' });
        router.push('/feed');
      } else {
        toast({ variant: 'destructive', title: 'Falha no envio', description: 'Por favor, tente novamente.' });
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foto</FormLabel>
                    <FormControl>
                        <Input type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => {
                            field.onChange(e.target.files);
                            handleFileChange(e);
                        }} />
                    </FormControl>
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

              <Button type="submit" className="w-full h-12 text-lg" disabled={isPending || !guestName}>
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
