// /src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, storage } from './firebase-admin'; // Importa a configuração do Firebase
import { FieldValue } from 'firebase-admin/firestore';
import type { Photo, Comment } from './types'; // Supondo que você tenha esses tipos
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
        // Garante que comments seja sempre um array
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

export async function createPhoto(author: string, caption: string, base64data: string, aiHint: string, filter?: string) {
    console.log('--- Starting createPhoto ---');
    console.log('Author:', author);
    if (!base64data.startsWith('data:image/')) {
        console.error('Invalid image format. Base64 data does not start with "data:image/".');
        return { success: false, message: 'Formato de imagem inválido.' };
    }

    try {
        console.log('Step 1: Decoding Base64 data...');
        const imageBuffer = Buffer.from(base64data.split(',')[1], 'base64');
        const mimeType = base64data.match(/data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
        console.log(`Step 1 Success: Decoded image. MimeType: ${mimeType}, Buffer length: ${imageBuffer.length}`);

        const fileName = `photos/${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        const file = storage.bucket().file(fileName);
        console.log(`Step 2: Preparing to upload to Firebase Storage. Filename: ${fileName}`);
        
        await file.save(imageBuffer, {
            metadata: { contentType: mimeType }
        });
        console.log('Step 2 Success: File saved to Storage.');

        console.log('Step 3: Making file public...');
        await file.makePublic();
        console.log('Step 3 Success: File is now public.');

        const publicUrl = file.publicUrl();
        console.log(`Step 4: Got public URL: ${publicUrl}`);
        
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

        console.log('Step 5: Preparing to add document to Firestore with data:', newPhotoData);
        const docRef = await db.collection(PHOTOS_COLLECTION).add(newPhotoData);
        console.log(`Step 5 Success: Document added to Firestore with ID: ${docRef.id}`);

        console.log('Step 6: Revalidating paths...');
        revalidatePath('/feed');
        revalidatePath('/admin/dashboard');
        console.log('Step 6 Success: Paths revalidated.');
        
        const newPhoto: Photo = {
            id: docRef.id,
            ...newPhotoData
        };

        console.log('--- createPhoto finished successfully! ---');
        return { success: true, photo: newPhoto };
    } catch (error) {
        console.error("--- ERROR in createPhoto ---");
        console.error(error);
        return { success: false, message: "Falha no upload da imagem." };
    }
}


export async function deletePhoto(photoId: string, imageUrl: string) {
  try {
    // 1. Delete from Firestore
    await db.collection(PHOTOS_COLLECTION).doc(photoId).delete();

    // 2. Delete from Storage
    const decodedUrl = decodeURIComponent(imageUrl);
    const filePath = decodedUrl.split('/o/')[1].split('?')[0];
    await storage.bucket().file(filePath).delete();
    
    revalidatePath('/feed');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch(error) {
    console.error("Erro ao excluir foto:", error);
    if (error instanceof Error && error.message.includes('does not exist')) {
        // If file is already gone from storage, but doc exists, still try to delete doc
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
