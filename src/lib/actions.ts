'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { photos } from './data';
import { suggestPhotoCaption as suggestPhotoCaptionFlow } from '@/ai/flows/suggest-photo-caption';
import type { Photo } from './types';

export async function getPhotos() {
  // Sort by newest first, return a sorted copy
  return [...photos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function likePhoto(photoId: string, like: boolean) {
  const photo = photos.find((p) => p.id === photoId);
  if (photo) {
    photo.likes += like ? 1 : -1;
    if (photo.likes < 0) photo.likes = 0;
    revalidatePath('/feed');
    return { success: true };
  }
  return { success: false, message: 'Foto não encontrada' };
}

export async function addComment(photoId: string, author: string, commentText: string) {
  const photo = photos.find((p) => p.id === photoId);
  if (photo) {
    const newComment = {
      id: `c${Date.now()}`,
      author,
      text: commentText,
      createdAt: new Date().toISOString(),
    };
    photo.comments.push(newComment);
    revalidatePath('/feed');
    // For optimistic update
    return { success: true, comment: newComment };
  }
  return { success: false, message: 'Foto não encontrada' };
}

export async function createPhoto(author: string, caption: string, imageUrl: string, aiHint: string, filter?: string) {
    const newPhoto: Photo = {
        id: `${Date.now()}`,
        author,
        caption,
        imageUrl,
        aiHint,
        filter: filter || 'filter-none',
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString(),
    };
    photos.unshift(newPhoto);
    revalidatePath('/feed');
    return { success: true, photo: newPhoto };
}


const SuggestCaptionSchema = z.object({
  photoDataUri: z.string(),
});
export async function suggestCaption(formData: FormData) {
  try {
    const { photoDataUri } = SuggestCaptionSchema.parse({
      photoDataUri: formData.get('photoDataUri'),
    });

    const result = await suggestPhotoCaptionFlow({
      photoDataUri,
      topicKeywords: 'casamento, celebração, alegria, amor, matrimônio, festa',
    });

    return { success: true, caption: result.suggestedCaption };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Não foi possível sugerir uma legenda.' };
  }
}
