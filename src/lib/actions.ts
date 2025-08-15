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
    return { success: true, comment: newComment };
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    return { success: false, message: 'Foto não encontrada ou erro no servidor' };
  }
}

// ATENÇÃO: Função createPhoto foi drasticamente alterada!
export async function createPhoto(author: string, caption: string, base64data: string, aiHint: string, filter?: string) {
    // A imagem vem como um Data URL (base64) da página de upload
    if (!base64data.startsWith('data:image/')) {
        return { success: false, message: 'Formato de imagem inválido.' };
    }

    try {
        // 1. Converter Base64 para um Buffer
        const imageBuffer = Buffer.from(base64data.split(',')[1], 'base64');
        const mimeType = base64data.match(/data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
        
        // 2. Fazer upload para o Firebase Storage
        const fileName = `photos/${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        const file = storage.bucket().file(fileName);
        await file.save(imageBuffer, {
            metadata: { contentType: mimeType }
        });

        // 3. Obter a URL pública da imagem
        const [publicUrl] = await file.getSignedUrl({
            action: 'read',
            expires: '01-01-2500' // Data de expiração longa
        });
        
        // 4. Salvar os metadados da foto no Firestore
        const newPhoto: Omit<Photo, 'id'> = {
            author,
            caption,
            imageUrl: publicUrl, // URL do Firebase Storage
            aiHint,
            filter: filter || 'filter-none',
            likes: 0,
            comments: [],
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection(PHOTOS_COLLECTION).add(newPhoto);

        // 5. Revalidar o cache e retornar sucesso
        revalidatePath('/feed');
        return { success: true, photo: { id: docRef.id, ...newPhoto } }; // Retorna o objeto para UI otimista
    } catch (error) {
        console.error("Erro ao criar foto:", error);
        return { success: false, message: "Falha no upload da imagem." };
    }
}


// A função de sugestão de legenda não precisa de alterações
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