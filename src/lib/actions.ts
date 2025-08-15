// /src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, storage } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Photo, Comment } from './types';
import { suggestPhotoCaption as suggestPhotoCaptionFlow } from '@/ai/flows/suggest-photo-caption';

const PHOTOS_COLLECTION = 'photos';

export async function getPhotos(): Promise<Photo[]> {
  try {
    const snapshot = await db.collection(PHOTOS_COLLECTION).orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      return [];
    }
    const photos = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        comments: data.comments || [],
       } as Photo
    });
    return photos;
  } catch (error) {
    console.error("Erro ao buscar fotos:", error);
    return [];
  }
}

export async function likePhoto(photoId: string, like: boolean) {
  try {
    const photoRef = db.collection(PHOTOS_COLLECTION).doc(photoId);
    const increment = FieldValue.increment(like ? 1 : -1);
    
    await photoRef.update({ likes: increment });
    
    revalidatePath('/feed');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (error) {
    console.error("Erro ao curtir foto:", error);
    return { success: false, message: 'Foto não encontrada ou erro no servidor' };
  }
}

export async function addComment(photoId: string, author: string, commentText: string) {
  try {
    const photoRef = db.collection(PHOTOS_COLLECTION).doc(photoId);
    const newComment: Comment = {
      id: `c${Date.now()}`,
      author,
      text: commentText,
      createdAt: new Date().toISOString(),
    };
    
    await photoRef.update({
      comments: FieldValue.arrayUnion(newComment)
    });

    revalidatePath('/feed');
    revalidatePath('/admin/dashboard');
    return { success: true, comment: newComment };
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    return { success: false, message: 'Foto não encontrada ou erro no servidor' };
  }
}

interface CreatePhotoArgs {
    author: string;
    caption: string;
    base64data: string;
    aiHint: string;
    filter?: string;
}

export async function createPhoto({ author, caption, base64data, aiHint, filter }: CreatePhotoArgs) {
    if (!author) {
      console.error('Error: Author is missing.');
      return { success: false, message: 'Usuário não identificado. Faça o login novamente.' };
    }
    
    if (!base64data || !base64data.startsWith('data:image/')) {
        console.error('Invalid image format. Base64 data is missing or does not start with "data:image/".');
        return { success: false, message: 'Formato de imagem inválido.' };
    }

    try {
        const imageBuffer = Buffer.from(base64data.split(',')[1], 'base64');
        const mimeType = base64data.match(/data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
        
        const fileName = `photos/${Date.now()}-${author.replace(/\s+/g, '-')}-${Math.round(Math.random() * 1E9)}.jpg`;
        const file = storage.bucket().file(fileName);
        
        await file.save(imageBuffer, {
            metadata: { contentType: mimeType }
        });
        
        await file.makePublic();

        const publicUrl = file.publicUrl();
        
        const newPhotoData: Omit<Photo, 'id'> = {
            author,
            caption,
            imageUrl: publicUrl,
            aiHint,
            filter: filter || 'filter-none',
            likes: 0,
            comments: [],
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection(PHOTOS_COLLECTION).add(newPhotoData);
        
        revalidatePath('/feed');
        revalidatePath('/admin/dashboard');
        
        const newPhoto: Photo = {
            id: docRef.id,
            ...newPhotoData
        };

        return { success: true, photo: newPhoto };
    } catch (error) {
        console.error("[CREATE_PHOTO_ERROR]", error);
        return { success: false, message: "Falha no upload da imagem." };
    }
}


export async function deletePhoto(photoId: string, imageUrl: string) {
  try {
    await db.collection(PHOTOS_COLLECTION).doc(photoId).delete();

    const decodedUrl = decodeURIComponent(imageUrl);
    const filePath = decodedUrl.split('/o/')[1].split('?')[0];
    await storage.bucket().file(filePath).delete();
    
    revalidatePath('/feed');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch(error) {
    console.error("Erro ao excluir foto:", error);
    if (error instanceof Error && error.message.includes('does not exist')) {
        try {
            await db.collection(PHOTOS_COLLECTION).doc(photoId).delete();
            revalidatePath('/feed');
            revalidatePath('/admin/dashboard');
            return { success: true };
        } catch (dbError){
            console.error("Erro ao excluir documento do Firestore após falha no storage:", dbError);
             return { success: false, message: "Falha ao excluir a foto do banco de dados." };
        }
    }
    return { success: false, message: "Falha ao excluir a foto." };
  }
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
