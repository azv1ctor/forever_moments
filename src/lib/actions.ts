// /src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Photo, Comment, Wedding } from './types';
import { suggestPhotoCaption as suggestPhotoCaptionFlow } from '@/ai/flows/suggest-photo-caption';
import fs from 'fs/promises';
import path from 'path';

const PHOTOS_COLLECTION = 'photos';
const WEDDINGS_COLLECTION = 'weddings';

// --- Photo Actions ---

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
    // Delete Firestore document
    await db.collection(PHOTOS_COLLECTION).doc(photoId).delete();

    // Delete local file
    const filePath = path.join(process.cwd(), 'public', imageUrl);
    // Check if file exists before attempting to delete
    try {
        await fs.access(filePath);
        await fs.unlink(filePath);
    } catch (fsError: any) {
        if (fsError.code !== 'ENOENT') {
            // If the error is not "file not found", log it but don't fail the operation
            console.warn(`Could not delete file ${filePath}:`, fsError);
        }
    }
    
    revalidatePath('/feed');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch(error) {
    console.error("Erro ao excluir foto:", error);
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

    const result = await suggestPhotoCaptionFlow({
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

// --- Wedding Actions ---

export async function getWeddings(): Promise<Wedding[]> {
  try {
    const snapshot = await db.collection(WEDDINGS_COLLECTION).orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wedding));
  } catch (error) {
    console.error("Erro ao buscar casamentos:", error);
    return [];
  }
}

const WeddingSchema = z.object({
  coupleNames: z.string().min(3, "Nomes dos noivos são obrigatórios."),
  date: z.string().min(1, "A data do evento é obrigatória."),
  plan: z.enum(['Básico', 'Premium', 'Deluxe']),
  price: z.number().min(0, "O preço deve ser um valor positivo."),
  status: z.enum(['Ativo', 'Concluído', 'Pendente']),
});

export async function createWedding(data: Omit<Wedding, 'id' | 'createdAt'>) {
    try {
        const validatedData = WeddingSchema.parse(data);
        const newWeddingData = {
            ...validatedData,
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection(WEDDINGS_COLLECTION).add(newWeddingData);
        const newWedding: Wedding = { id: docRef.id, ...newWeddingData };

        revalidatePath('/admin/weddings');
        return { success: true, wedding: newWedding };
    } catch (error) {
        console.error("[CREATE_WEDDING_ERROR]", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        return { success: false, message: `Falha ao criar casamento: ${errorMessage}` };
    }
}

export async function updateWedding(id: string, data: Partial<Omit<Wedding, 'id' | 'createdAt'>>) {
    try {
        const validatedData = WeddingSchema.partial().parse(data);
        
        await db.collection(WEDDINGS_COLLECTION).doc(id).update(validatedData);

        const doc = await db.collection(WEDDINGS_COLLECTION).doc(id).get();
        const updatedWedding = { id: doc.id, ...doc.data() } as Wedding;

        revalidatePath('/admin/weddings');
        return { success: true, wedding: updatedWedding };
    } catch (error) {
        console.error("[UPDATE_WEDDING_ERROR]", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        return { success: false, message: `Falha ao atualizar casamento: ${errorMessage}` };
    }
}

export async function deleteWedding(id: string) {
    try {
        await db.collection(WEDDINGS_COLLECTION).doc(id).delete();
        revalidatePath('/admin/weddings');
        return { success: true };
    } catch (error) {
        console.error("[DELETE_WEDDING_ERROR]", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        return { success: false, message: `Falha ao excluir casamento: ${errorMessage}` };
    }
}
