// src/app/(app)/[weddingId]/tv/page.tsx

import { getPhotos, getWedding } from '@/lib/actions';
import { notFound } from 'next/navigation';
import { TvCarousel } from '@/components/tv-carousel';

export const dynamic = 'force-dynamic';

export default async function TVPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  
  const [wedding, initialPhotos] = await Promise.all([
    getWedding(weddingId),
    getPhotos(weddingId)
  ]);

  if (!wedding) {
    notFound();
  }

  return (
    <div className="h-screen w-screen bg-black text-white font-body">
      <TvCarousel initialPhotos={initialPhotos} wedding={wedding} />
    </div>
  );
}
