'use client';

import { useEffect, useState } from 'react';
import type { Photo, Wedding } from '@/lib/types';
import { getPhotos } from '@/lib/actions';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Tv } from 'lucide-react';

export function TvCarousel({ initialPhotos, wedding }: { initialPhotos: Photo[], wedding: Wedding }) {
    const [photos, setPhotos] = useState<Photo[]>(initialPhotos);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            try {
                const newPhotos = await getPhotos(wedding.id);
                // Apenas atualiza o estado se houver mudança no número de fotos para evitar re-renderizações desnecessárias
                if (newPhotos.length !== photos.length) {
                    setPhotos(newPhotos);
                }
            } catch (error) {
                console.error("Failed to fetch new photos for TV mode:", error);
            }
        }, 15000); // Fetch every 15 seconds

        return () => clearInterval(intervalId);
    }, [wedding.id, photos.length]);

    return (
        <div className="h-full w-full relative flex flex-col">
            <header className="absolute top-0 left-0 right-0 z-10 p-8 bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex items-center gap-3">
                    {wedding.logoUrl ? (
                        <Image src={wedding.logoUrl} alt={`Logo ${wedding.coupleNames}`} width={60} height={60} className="rounded-full object-cover" />
                    ) : (
                        <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center"><Tv className="h-8 w-8 text-white"/></div>
                    )}
                    <h1 className="text-4xl font-bold font-headline">{wedding.coupleNames}</h1>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center">
                {photos.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center p-8">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full mb-6">
                            <Tv className="h-12 w-12 text-primary"/>
                        </div>
                        <h2 className="text-3xl font-headline font-bold text-white">Aguardando as primeiras fotos...</h2>
                        <p className="mt-2 text-lg text-white/70">As fotos enviadas pelos convidados aparecerão aqui em tempo real!</p>
                    </div>
                ) : (
                    <Carousel
                        plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
                        opts={{ loop: true }}
                        className="w-full h-full"
                    >
                        <CarouselContent>
                            {photos.map((photo, index) => (
                                <CarouselItem key={photo.id} className="relative h-full w-full">
                                    <AnimatePresence>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 1.5 }}
                                            className="h-full w-full relative"
                                        >
                                            <Image
                                                src={photo.imageUrl}
                                                alt={photo.caption || `Foto por ${photo.author}`}
                                                fill
                                                className="object-contain"
                                                priority={index === 0}
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 z-10 text-white bg-gradient-to-t from-black/80 to-transparent p-8 pt-20 text-center">
                                                <p className="text-2xl font-bold">{photo.author}</p>
                                                {photo.caption && <p className="text-xl mt-1">{photo.caption}</p>}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                )}
            </main>
        </div>
    );
}
