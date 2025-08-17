// src/components/tv-carousel.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Photo, Wedding } from '@/lib/types';
import { getPhotos } from '@/lib/actions';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TvCarousel({
  initialPhotos,
  wedding,
}: {
  initialPhotos: Photo[];
  wedding: Wedding;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const newPhotos = await getPhotos(wedding.id);
        if (newPhotos.length !== photos.length) {
          setPhotos(newPhotos);
        }
      } catch (error) {
        console.error('Failed to fetch new photos for TV mode:', error);
      }
    }, 15000);

    return () => clearInterval(intervalId);
    // Dependemos apenas de wedding.id e photos.length para evitar re-fetch excessivo
  }, [wedding.id, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-center p-8">
        <div className="mx-auto bg-primary/10 p-4 rounded-full mb-6">
          <Tv className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-3xl font-headline font-bold text-white">
          Aguardando as primeiras fotos...
        </h2>
        <p className="mt-2 text-lg text-white/70">
          As fotos enviadas pelos convidados aparecerão aqui em tempo real!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative flex flex-col">
      {/* Cabeçalho sobreposto */}
      <header className="absolute top-0 left-0 right-0 z-20 p-8 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-4">
          {wedding.logoUrl ? (
            <Image
              src={wedding.logoUrl}
              alt={`Logo ${wedding.coupleNames}`}
              width={60}
              height={60}
              className="rounded-full object-cover"
              priority
            />
          ) : (
            <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center">
              <Tv className="h-8 w-8 text-white" />
            </div>
          )}
          <h1 className="text-4xl font-bold font-headline">{wedding.coupleNames}</h1>
        </div>
      </header>

      {/* Área principal ocupa toda a altura disponível */}
      <main className="flex-1 w-full h-full">
        {/* Garantimos que a raiz do Carousel ocupe 100% */}
        <Carousel
          plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
          opts={{ loop: true }}
          className="w-full h-full"
        >
          {/* O container de slides também ocupa 100% */}
          <CarouselContent className="h-full">
            {photos.map((photo) => (
              <CarouselItem key={photo.id} className="h-full w-full p-0">
                {/* Wrapper com altura explícita para o next/image com fill */}
                <div className="relative w-full h-[100vh]">
                  {photo.mediaType === 'video' ? (
                    <video
                      src={photo.imageUrl}
                      className="object-contain w-full h-full"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <Image
                      src={photo.imageUrl}
                      alt={photo.caption || `Foto por ${photo.author}`}
                      fill
                      className={cn('object-contain', photo.filter)}
                      sizes="100vw"
                      priority
                    />
                  )}

                  {/* Legendas/overlay */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 text-white bg-gradient-to-t from-black/80 to-transparent p-8 pt-20 text-center">
                    <p className="text-2xl font-bold drop-shadow-lg">{photo.author}</p>
                    {photo.caption && (
                      <p className="text-xl mt-1 drop-shadow-md">{photo.caption}</p>
                    )}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </main>
    </div>
  );
}
