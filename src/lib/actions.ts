// /src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Photo, Comment, Wedding, WeddingStatus, WeddingPlan } from './types';
import { suggestPhotoCaption } from '@/ai/flows/suggest-photo-caption';
import fs from 'fs/promises';
import path from 'path';

const PHOTOS_COLLECTION = 'photos';
const WEDDINGS_COLLECTION = 'weddings';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Helper function to handle file saving
async function saveFile(file: File, subfolder: string): Promise<string> {
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const folderPath = path.join(UPLOADS_DIR, subfolder);
    await fs.mkdir(folderPath, { recursive: true });
    
    // Create a unique filename
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.name}`;
    const localPath = path.join(folderPath, filename);
    
    await fs.writeFile(localPath, fileBuffer);
    
    return `/uploads/${subfolder}/${filename}`;
}

// --- Photo Actions ---

export async function getPhotos(weddingId: string): Promise<Photo[]> {
  try {
    const snapshot = await db.collection(PHOTOS_COLLECTION)
                             .where('weddingId', '==', weddingId)
                             .orderBy('createdAt', 'desc')
                             .get();
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

export async function likePhoto(photoId: string, weddingId: string, like: boolean) {
  try {
    const photoRef = db.collection(PHOTOS_COLLECTION).doc(photoId);
    const increment = FieldValue.increment(like ? 1 : -1);
    
    await photoRef.update({ likes: increment });
    
    revalidatePath(`/${weddingId}/feed`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao curtir foto:", error);
    return { success: false, message: 'Foto não encontrada ou erro no servidor' };
  }
}

export async function addComment(photoId: string, weddingId: string, author: string, commentText: string) {
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

    revalidatePath(`/${weddingId}/feed`);
    return { success: true, comment: newComment };
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    return { success: false, message: 'Foto não encontrada ou erro no servidor' };
  }
}

const CreatePhotoSchema = z.object({
  weddingId: z.string(),
  author: z.string(),
  caption: z.string().optional(),
  photo: z.instanceof(File),
  aiHint: z.string().optional(),
  filter: z.string().optional(),
});

export async function createPhoto(formData: FormData) {
    try {
        const data = Object.fromEntries(formData);
        const validated = CreatePhotoSchema.safeParse(data);

        if (!validated.success) {
            return { success: false, message: `Dados inválidos: ${validated.error.message}` };
        }
        
        const { weddingId, author, caption, photo, aiHint, filter } = validated.data;
        
        if (!author) {
            return { success: false, message: 'Usuário não identificado. Faça o login novamente.' };
        }
        
        const publicUrl = await saveFile(photo, weddingId);
        
        const newPhotoData: Omit<Photo, 'id'> = {
            weddingId,
            author,
            caption: caption || '',
            imageUrl: publicUrl,
            aiHint: aiHint || "user uploaded",
            filter: filter || 'filter-none',
            likes: 0,
            comments: [],
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection(PHOTOS_COLLECTION).add(newPhotoData);
        
        revalidatePath(`/${weddingId}/feed`);
        
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

export async function deletePhoto(photoId: string, weddingId: string, imageUrl: string) {
  try {
    // Delete Firestore document
    await db.collection(PHOTOS_COLLECTION).doc(photoId).delete();

    // Delete local file
    const filePath = path.join(process.cwd(), 'public', imageUrl);
    try {
        await fs.access(filePath);
        await fs.unlink(filePath);
    } catch (fsError: any) {
        if (fsError.code !== 'ENOENT') {
            console.warn(`Could not delete file ${filePath}:`, fsError);
        }
    }
    
    revalidatePath(`/${weddingId}/feed`);
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

// --- Wedding Actions ---
export async function getWedding(id: string): Promise<Wedding | null> {
    try {
        const doc = await db.collection(WEDDINGS_COLLECTION).doc(id).get();
        if (!doc.exists) {
            return null;
        }
        return { id: doc.id, ...doc.data() } as Wedding;
    } catch (error) {
        console.error("Erro ao buscar casamento:", error);
        return null;
    }
}


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
  price: z.coerce.number().min(0, "O preço deve ser um valor positivo."),
  status: z.enum(['Ativo', 'Concluído', 'Pendente']),
  logo: z.instanceof(File).optional(),
});

export async function createWedding(formData: FormData) {
    try {
        const data = Object.fromEntries(formData);
        const validated = WeddingSchema.safeParse(data);

        if (!validated.success) {
            return { success: false, message: `Dados inválidos: ${validated.error.message}` };
        }
        const { logo, ...weddingData } = validated.data;
        let logoUrl;

        if (logo && logo.size > 0) {
            logoUrl = await saveFile(logo, 'logos');
        }

        const newWeddingData = {
            ...weddingData,
            logoUrl,
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection(WEDDINGS_COLLECTION).add(newWeddingData);
        const newWedding: Wedding = { id: docRef.id, ...newWeddingData, plan: newWeddingData.plan as WeddingPlan, status: newWeddingData.status as WeddingStatus };

        revalidatePath('/admin/weddings');
        return { success: true, wedding: newWedding };
    } catch (error) {
        console.error("[CREATE_WEDDING_ERROR]", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        return { success: false, message: `Falha ao criar casamento: ${errorMessage}` };
    }
}

export async function updateWedding(id: string, formData: FormData) {
    try {
        const data = Object.fromEntries(formData);
        const validated = WeddingSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, message: `Dados inválidos: ${validated.error.message}` };
        }
        const { logo, ...weddingData } = validated.data;
        
        let logoUrl;
        if (logo && logo.size > 0) {
            logoUrl = await saveFile(logo, 'logos');
        }
        
        const updateData: any = { ...weddingData };
        if (logoUrl) {
            updateData.logoUrl = logoUrl;
        }

        await db.collection(WEDDINGS_COLLECTION).doc(id).update(updateData);

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
        // Here you might want to delete all associated photos first
        const photosSnapshot = await db.collection(PHOTOS_COLLECTION).where('weddingId', '==', id).get();
        const deletePromises = photosSnapshot.docs.map(doc => {
            const photo = doc.data() as Photo;
            // Also delete file from local storage
            const filePath = path.join(process.cwd(), 'public', photo.imageUrl);
            fs.unlink(filePath).catch(err => console.warn(`Could not delete file ${filePath}:`, err));
            return doc.ref.delete();
        });
        await Promise.all(deletePromises);

        // Delete the wedding document itself
        await db.collection(WEDDINGS_COLLECTION).doc(id).delete();
        
        revalidatePath('/admin/weddings');
        return { success: true };
    } catch (error) {
        console.error("[DELETE_WEDDING_ERROR]", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        return { success: false, message: `Falha ao excluir casamento: ${errorMessage}` };
    }
}
