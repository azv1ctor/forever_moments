'use client';

import { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { Heart, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { addComment, likePhoto } from '@/lib/actions';
import type { Photo, Comment as CommentType } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PhotoCard({ photo: initialPhoto }: { photo: Photo }) {
  const [photo, setPhoto] = useState(initialPhoto);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isPending, startTransition] = useTransition();
  const [guestName, setGuestName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const likedPhotos = JSON.parse(localStorage.getItem('likedPhotos') || '[]');
    setIsLiked(likedPhotos.includes(photo.id));
    setGuestName(localStorage.getItem('guestName') || 'Convidado');
  }, [photo.id]);

  const timeAgo = formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true, locale: ptBR });

  const handleLike = async () => {
    const newLikedState = !isLiked;
    const originalLikes = photo.likes;

    setIsLiked(newLikedState);
    setPhoto(prev => ({ ...prev, likes: prev.likes + (newLikedState ? 1 : -1) }));

    const likedPhotos = JSON.parse(localStorage.getItem('likedPhotos') || '[]');
    if (newLikedState) {
      localStorage.setItem('likedPhotos', JSON.stringify([...likedPhotos, photo.id]));
    } else {
      localStorage.setItem('likedPhotos', JSON.stringify(likedPhotos.filter((id: string) => id !== photo.id)));
    }

    const result = await likePhoto(photo.id, newLikedState);
    if (!result.success) {
      // Revert optimistic update on failure
      setIsLiked(!newLikedState);
      setPhoto(prev => ({...prev, likes: originalLikes }));
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível registrar sua curtida.' });
    }
  };
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    startTransition(async () => {
        const result = await addComment(photo.id, guestName, newComment.trim());
        if(result.success && result.comment) {
            setPhoto(prev => ({ ...prev, comments: [...prev.comments, result.comment as CommentType] }));
            setNewComment('');
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.message });
        }
    });
  }

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
      
      <Dialog>
        <DialogTrigger asChild>
          <CardContent className="p-0 grow cursor-pointer">
            <div className="aspect-[4/5] relative w-full">
              <Image
                src={photo.imageUrl}
                alt={photo.caption || 'Foto do casamento'}
                fill
                className={cn('object-cover', photo.filter)}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                data-ai-hint={photo.aiHint}
              />
            </div>
          </CardContent>
        </DialogTrigger>
        <DialogContent className="p-0 max-w-3xl bg-transparent border-0">
            <Image
              src={photo.imageUrl}
              alt={photo.caption || 'Foto do casamento'}
              width={1024}
              height={1280}
              className={cn('object-contain w-full h-auto', photo.filter)}
            />
        </DialogContent>
      </Dialog>
      
      {photo.caption && <p className="p-4 text-sm">{photo.caption}</p>}
      
      <CardFooter className="p-2 mt-auto border-t flex-col items-start">
        <div className="w-full flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center gap-2 text-muted-foreground hover:text-red-500">
                <Heart className={`h-5 w-5 transition-colors ${isLiked ? 'text-red-500 fill-current' : ''}`}/>
                <span>{photo.likes}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
                <span>{photo.comments.length}</span>
            </Button>
        </div>
        {showComments && (
            <div className="w-full p-2 space-y-3">
                <div className="max-h-32 overflow-y-auto space-y-2">
                    {photo.comments.map(comment => (
                        <div key={comment.id} className="text-xs">
                           <span className="font-semibold">{comment.author}:</span>{' '}
                           {comment.text}
                        </div>
                    ))}
                    {photo.comments.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center">Seja o primeiro a comentar!</p>
                    )}
                </div>
                <form onSubmit={handleAddComment} className="flex gap-2">
                    <Input 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Adicione um comentário..."
                        className="h-8 text-xs"
                        disabled={isPending}
                    />
                    <Button type="submit" size="sm" className="h-8" disabled={isPending || !newComment.trim()}>
                        {isPending ? '...' : 'Enviar'}
                    </Button>
                </form>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}

    