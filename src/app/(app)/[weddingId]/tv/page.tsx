
'use client';

import { useEffect, useState } from 'react';
import { getPhotos, getWedding } from '@/lib/actions';
import type { Photo, Wedding } from '@/lib/types';
import { useParams, notFound } from 'next/navigation';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { Logo } from '@/components/logo';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tv } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function TvCarousel({ initialPhotos, wedding }: { initialPhotos: Photo[], wedding: Wedding }) {
    const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
    const weddingId = wedding.id;

    useEffect(() => {
        const intervalId = setInterval(async () => {
            try {
                const newPhotos = await getPhotos(weddingId);
                 // Sort to ensure the newest photo is first
                newPhotos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setPhotos(newPhotos);
            } catch (error) {
                console.error("Failed to fetch new photos for TV mode:", error);
            }
        }, 15000); // Fetch every 15 seconds

        return () => clearInterval(intervalId);
    }, [weddingId]);


    if (photos.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center p-8">
                 <div className="mx-auto bg-primary/10 p-4 rounded-full mb-6">
                    <Tv className="h-12 w-12 text-primary"/>
                 </div>
                <h2 className="text-3xl font-headline font-bold text-white">Aguardando as primeiras fotos...</h2>
                <p className="mt-2 text-lg text-white/70">As fotos enviadas pelos convidados aparecerão aqui em tempo real!</p>
            </div>
        )
    }

    return (
        <div className="h-full w-full relative">
            <Carousel
                plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
                opts={{ loop: true }}
                className="w-full h-full"
            >
                <CarouselContent>
                    {photos.map((photo, index) => (
                        <CarouselItem key={photo.id} className="relative">
                            <AnimatePresence>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1.5 }}
                                    className="h-full w-full"
                                >
                                    <Image
                                        src={photo.imageUrl}
                                        alt={photo.caption || `Foto por ${photo.author}`}
                                        fill
                                        className="object-contain"
                                        priority={index === 0}
                                    />
                                    <div className="absolute bottom-8 left-8 right-8 text-white bg-black/50 p-4 rounded-lg shadow-lg">
                                        <p className="text-xl font-bold">{photo.author}</p>
                                        {photo.caption && <p className="text-lg">{photo.caption}</p>}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}


export default function TVPage() {
    const params = useParams();
    const weddingId = params.weddingId as string;
    const [wedding, setWedding] = useState<Wedding | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!weddingId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [weddingData, photoData] = await Promise.all([
                    getWedding(weddingId),
                    getPhotos(weddingId),
                ]);

                if (!weddingData) {
                    notFound();
                    return;
                }
                
                weddingData.coupleNames = weddingData.coupleNames || "Nosso Casamento";
                
                setWedding(weddingData);
                setPhotos(photoData);

            } catch (error) {
                console.error("Failed to fetch initial data for TV mode:", error);
                // Optionally show an error state
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [weddingId]);


    if (isLoading) {
        return (
             <div className="h-screen w-screen bg-black flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                    <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-screen w-screen" />
                </div>
            </div>
        );
    }
    
    if (!wedding) {
        return notFound();
    }


    return (
        <div className="h-screen w-screen bg-black text-white font-body flex flex-col">
            <header className="absolute top-0 left-0 right-0 z-10 p-8">
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
                 <TvCarousel initialPhotos={photos} wedding={wedding} />
            </main>
        </div>
    );
}
