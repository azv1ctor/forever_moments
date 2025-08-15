// /src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Photo, Comment } from './types';
import { suggestPhotoCaption } from '@/ai/flows/suggest-photo-caption';
import fs from 'fs/promises';
import path from 'path';

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
      return { success: false, message: 'Usuário não identificado. Faça o login novamente.' };
    }
    
    if (!base64data || !base64data.startsWith('data:image/')) {
        return { success: false, message: 'Formato de imagem inválido.' };
    }

    try {
        const imageBuffer = Buffer.from(base64data.split(',')[1], 'base64');
        const mimeType = base64data.match(/data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
        const extension = mimeType.split('/')[1];

        const fileName = `photos/${Date.now()}-${author.replace(/\s+/g, '-')}-${Math.round(Math.random() * 1E9)}.${extension}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        
        // Create upload directory if it doesn't exist
        await fs.mkdir(uploadDir, { recursive: true });
        
        const localPath = path.join(uploadDir, fileName.split('/')[1]);
        await fs.writeFile(localPath, imageBuffer);
        
        const publicUrl = `/uploads/${fileName.split('/')[1]}`;
        
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
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        return { success: false, message: `Falha no upload da imagem: ${errorMessage}` };
    }
}


export async function deletePhoto(photoId: string, imageUrl: string) {
  try {
    await db.collection(PHOTOS_COLLECTION).doc(photoId).delete();

    // Delete local file
    const filePath = path.join(process.cwd(), 'public', imageUrl);
    await fs.unlink(filePath);
    
    revalidatePath('/feed');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch(error) {
    console.error("Erro ao excluir foto:", error);
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.warn(`Local file for photoId ${photoId} not found, but proceeding.`);
        revalidatePath('/feed');
        revalidatePath('/admin/dashboard');
        return { success: true, message: "Documento do Firestore excluído, mas o arquivo de imagem não foi encontrado (pode já ter sido removido)." };
    }
    return { success: false, message: `Falha ao excluir a foto. Detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
  }
}

const SuggestCaptionSchema = z.object({
  photoDataUri: z.string(),
});
export async function suggestCaptionAction(formData: FormData) {
  try {
    const { photoDataUri } = SuggestCaptionSchema.parse({
      photoDataUri: formData.get('photoDataUri'),
    });

    const result = await suggestPhotoCaption({
      photoDataUri,
      topicKeywords: 'casamento, celebração, alegria, amor, matrimônio, festa',
    });

    return { success: true, caption: result.suggestedCaption };
  } catch (error) {
    console.error('[SUGGEST_CAPTION_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
    return { success: false, message: `Não foi possível sugerir uma legenda: ${errorMessage}` };
  }
}
