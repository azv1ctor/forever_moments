// src/app/(app)/[weddingId]/tv/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { getPhotos, getWedding } from '@/lib/actions';
import type { Photo, Wedding } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import Autoplay from "embla-carousel-autoplay";

export const dynamic = 'force-dynamic';

function TvCarousel({ initialPhotos, wedding }: { initialPhotos: Photo[], wedding: Wedding }) {
    const [photos, setPhotos] = useState<Photo[]>(initialPhotos);

    // Poll for new photos every 15 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            const newPhotos = await getPhotos(wedding.id);
            // Check if there are actually new photos before updating state
            if (newPhotos.length > photos.length) {
                setPhotos(newPhotos);
            }
        }, 15000); // 15 seconds

        return () => clearInterval(interval);
    }, [wedding.id, photos.length]);
    
    return (
        <div className="relative h-screen w-screen overflow-hidden bg-black">
             <div className="absolute top-8 left-8 z-20 flex items-center gap-4 bg-black/50 p-4 rounded-xl backdrop-blur-sm">
                {wedding.logoUrl ? (
                    <Image src={wedding.logoUrl} alt={`Logo ${wedding.coupleNames}`} width={80} height={80} className="rounded-full object-cover" />
                ) : (
                    <div className="w-20 h-20 flex items-center justify-center">
                        <Logo />
                    </div>
                )}
                <h1 className="text-4xl font-headline text-white shadow-lg">{wedding.coupleNames}</h1>
            </div>

            <Carousel
                className="w-full h-full"
                plugins={[
                    Autoplay({
                        delay: 5000, // 5 seconds per slide
                        stopOnInteraction: false,
                    }),
                ]}
                opts={{
                    loop: true,
                    align: 'start',
                }}
            >
                <CarouselContent className="h-full">
                    {photos.map((photo, index) => (
                        <CarouselItem key={photo.id || index} className="h-full relative">
                            <Card className="h-full w-full bg-black border-0 rounded-none">
                                <CardContent className="relative flex h-full items-center justify-center p-0">
                                    <Image
                                        src={photo.imageUrl}
                                        alt={photo.caption || `Foto por ${photo.author}`}
                                        fill
                                        className={cn('object-contain', photo.filter)}
                                        priority={index === 0} // Prioritize loading the first image
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-8 text-white">
                                        {photo.caption && <p className="text-2xl font-bold mb-1 shadow-lg">{photo.caption}</p>}
                                        <p className="text-lg text-white/80 shadow-md">Enviado por: {photo.author}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}


export default function TvPage() {
    const params = useParams();
    const weddingId = params.weddingId as string;
    const [initialData, setInitialData] = useState<{ wedding: Wedding, photos: Photo[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!weddingId) return;

        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const wedding = await getWedding(weddingId);
                if (!wedding) {
                    notFound();
                    return;
                }
                // Check if the plan allows for TV Carousel
                if (!wedding.planDetails.tvCarousel) {
                    // You can create a more elegant "feature not available" page
                    // For now, just redirecting to the feed
                    window.location.href = `/${weddingId}/feed`;
                    return;
                }
                const photos = await getPhotos(weddingId);
                setInitialData({ wedding, photos });
            } catch (error) {
                console.error("Failed to load TV mode data", error);
                notFound();
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [weddingId]);

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-8 w-64" />
                    <p className="text-white/50">Carregando momentos...</p>
                </div>
            </div>
        );
    }

    if (!initialData || initialData.photos.length === 0) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center text-center bg-black text-white p-4">
                {initialData?.wedding.logoUrl && (
                     <Image src={initialData.wedding.logoUrl} alt={`Logo ${initialData.wedding.coupleNames}`} width={100} height={100} className="rounded-full object-cover mb-6" />
                )}
                <h1 className="text-4xl font-headline mb-4">Aguardando as primeiras fotos...</h1>
                <p className="text-xl text-white/70">As fotos enviadas pelos convidados aparecerão aqui em tempo real!</p>
            </div>
        );
    }
    
    return <TvCarousel initialPhotos={initialData.photos} wedding={initialData.wedding} />;
}
