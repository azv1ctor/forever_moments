import Image from 'next/image';
import { Heart, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { likePhoto } from '@/lib/actions';
import type { Photo } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default async function PhotoCard({ photo }: { photo: Photo }) {
  const timeAgo = formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true });

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl">
      <CardHeader className="flex flex-row items-center gap-3 p-4">
        <Avatar>
          <AvatarFallback>{photo.author.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="grid gap-0.5">
          <CardTitle className="text-base font-semibold">{photo.author}</CardTitle>
          <CardDescription className="text-xs">{timeAgo}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0 grow">
        <div className="aspect-[4/5] relative w-full">
            <Image
                src={photo.imageUrl}
                alt={photo.caption || 'Wedding photo'}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                data-ai-hint={photo.aiHint}
            />
        </div>
        {photo.caption && <p className="p-4 text-sm">{photo.caption}</p>}
      </CardContent>
      <CardFooter className="p-2 mt-auto border-t flex items-center justify-between">
        <form action={async () => { 'use server'; await likePhoto(photo.id); }}>
            <Button variant="ghost" size="sm" type="submit" className="flex items-center gap-2 text-muted-foreground hover:text-red-500">
                <Heart className="h-5 w-5 transition-colors"/>
                <span>{photo.likes}</span>
            </Button>
        </form>
        <div className="flex items-center gap-2 text-sm text-muted-foreground pr-2">
            <MessageSquare className="h-5 w-5" />
            <span>{photo.comments.length}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
