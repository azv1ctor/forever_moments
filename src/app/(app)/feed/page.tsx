
import { getPhotos, getWedding } from '@/lib/actions';
import PhotoCard from '@/components/photo-card';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function FeedPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  const [photos, wedding] = await Promise.all([
    getPhotos(weddingId),
    getWedding(weddingId),
  ]);

  if (!wedding) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {photos.length === 0 ? (
        <div className="text-center py-20">
            <h2 className="font-headline text-2xl mb-2">Ainda não há fotos!</h2>
            <p className="text-muted-foreground">Seja o primeiro a compartilhar um momento do casamento de {wedding.coupleNames}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}
