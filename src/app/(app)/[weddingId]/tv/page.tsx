// src/app/(app)/[weddingId]/tv/page.tsx
import { getPhotos, getWedding } from '@/lib/actions';
import { notFound } from 'next/navigation';
import { TvCarousel } from '@/components/tv-carousel';

export const dynamic = 'force-dynamic';

export default async function TVPage({ params }: { params: { weddingId: string } }) {
  // Busca os dados do casamento e as fotos iniciais em paralelo
  const [wedding, initialPhotos] = await Promise.all([
    getWedding(params.weddingId),
    getPhotos(params.weddingId)
  ]);

  // Se o casamento não for encontrado, exibe a página 404
  if (!wedding) {
    notFound();
  }

  return (
    <div className="h-screen w-screen bg-black text-white font-body">
      <TvCarousel initialPhotos={initialPhotos} wedding={wedding} />
    </div>
  );
}
