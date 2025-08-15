import { getPhotos } from '@/lib/actions';
import PhotoCard from '@/components/photo-card';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const photos = await getPhotos();

  return (
    <div className="container mx-auto px-4 py-8">
      {photos.length === 0 ? (
        <div className="text-center py-20">
            <h2 className="font-headline text-2xl mb-2">No photos yet!</h2>
            <p className="text-muted-foreground">Be the first to share a moment from the wedding.</p>
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
