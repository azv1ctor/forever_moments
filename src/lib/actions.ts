// /src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Photo, Comment, Wedding, WeddingStatus, WeddingPlan, PlanDetails, MediaType, AnalyticsData } from './types';
import { suggestPhotoCaption } from '@/ai/flows/suggest-photo-caption';
import { plans } from '@/lib/plans';
import fs from 'fs/promises';
import path from 'path';
import { format, subDays } from 'date-fns';

const PHOTOS_COLLECTION = 'photos';
const WEDDINGS_COLLECTION = 'weddings';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Helper function to handle file saving
async function saveFile(file: File, subfolder: string): Promise<string> {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const folderPath = path.join(UPLOADS_DIR, subfolder);
    await fs.mkdir(folderPath, { recursive: true });
    
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
    
    // Ordenar no código para evitar a necessidade de um índice composto no Firestore
    photos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

export async function createPhoto(formData: FormData) {
    try {
        const file = formData.get('file');
        const weddingId = formData.get('weddingId');
        const author = formData.get('author');
        const caption = formData.get('caption');
        const filter = formData.get('filter');

        if (!(file instanceof File) || file.size === 0) {
            return { success: false, message: 'Arquivo inválido ou não enviado.' };
        }

        if (!weddingId || typeof weddingId !== 'string') {
            return { success: false, message: 'ID do casamento é inválido.' };
        }
        
        if (!author || typeof author !== 'string') {
            return { success: false, message: 'Autor não identificado.' };
        }
        
        const publicUrl = await saveFile(file, weddingId);
        
        const mediaType: MediaType = file.type.startsWith('video/') ? 'video' : 'image';

        const newPhotoData: Omit<Photo, 'id'> = {
            weddingId,
            author,
            caption: typeof caption === 'string' ? caption : '',
            imageUrl: publicUrl,
            filter: typeof filter === 'string' ? filter : 'filter-none',
            likes: 0,
            comments: [],
            createdAt: new Date().toISOString(),
            mediaType,
            aiHint: 'user-uploaded'
        };

        const docRef = await db.collection(PHOTOS_COLLECTION).add(newPhotoData);
        
        revalidatePath(`/${weddingId}/feed`);
        revalidatePath(`/${weddingId}/tv`);
        
        const newPhoto: Photo = {
            id: docRef.id,
            ...newPhotoData
        };

        return { success: true, photo: newPhoto };
    } catch (error) {
        console.error("[CREATE_PHOTO_ERROR]", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        return { success: false, message: `Falha no upload da mídia: ${errorMessage}` };
    }
}


export async function deletePhoto(photoId: string, weddingId: string, imageUrl: string) {
  try {
    // Delete Firestore document
    await db.collection(PHOTOS_COLLECTION).doc(photoId).delete();

    // Delete local file
    try {
        const filePath = path.join(process.cwd(), 'public', imageUrl);
        await fs.access(filePath);
        await fs.unlink(filePath);
    } catch (fsError: any) {
        if (fsError.code !== 'ENOENT') {
            console.warn(`Could not delete file ${imageUrl}:`, fsError);
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
  status: z.enum(['Ativo', 'Inativo']),
  logo: z.instanceof(File).optional().nullable(),
});

export async function createWedding(formData: FormData) {
    try {
        const data = Object.fromEntries(formData);
        const parsedData = { ...data, logo: data.logo instanceof File ? data.logo : null }
        const validated = WeddingSchema.safeParse(parsedData);

        if (!validated.success) {
            return { success: false, message: `Dados inválidos: ${validated.error.message}` };
        }
        const { logo, ...weddingData } = validated.data;
        let logoUrl;

        if (logo && logo.size > 0) {
            logoUrl = await saveFile(logo, 'logos');
        }

        const planDetails: PlanDetails = plans[weddingData.plan].features;

        const newWeddingData = {
            ...weddingData,
            logoUrl: logoUrl || undefined,
            createdAt: new Date().toISOString(),
            planDetails,
        };

        const docRef = await db.collection(WEDDINGS_COLLECTION).add(newWeddingData);
        const newWedding: Wedding = { 
            id: docRef.id, 
            ...newWeddingData, 
            plan: newWeddingData.plan as WeddingPlan, 
            status: newWeddingData.status as WeddingStatus 
        };

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
        const parsedData = { ...data, logo: data.logo instanceof File ? data.logo : null }
        
        const UpdateWeddingSchema = WeddingSchema.partial().extend({
             status: z.enum(['Ativo', 'Inativo']).optional(),
             coupleNames: z.string().min(3, "Nomes dos noivos são obrigatórios.").optional(),
             date: z.string().min(1, "A data do evento é obrigatória.").optional(),
        });
        const validated = UpdateWeddingSchema.safeParse(parsedData);


        if (!validated.success) {
            return { success: false, message: `Dados inválidos: ${validated.error.message}` };
        }
        const { logo, ...weddingData } = validated.data;
        
        const updateData = { ...weddingData };
        
        if (logo && logo.size > 0) {
            const currentWedding = await getWedding(id);
            if(currentWedding?.logoUrl) {
                try {
                    const oldLogoPath = path.join(process.cwd(), 'public', currentWedding.logoUrl);
                    await fs.unlink(oldLogoPath);
                } catch(e) {
                    console.warn("Could not delete old logo", e);
                }
            }
            (updateData as any).logoUrl = await saveFile(logo, 'logos');
        }

        if (updateData.plan) {
            const planKey = updateData.plan as WeddingPlan;
            (updateData as any).planDetails = plans[planKey].features;
        }

        await db.collection(WEDDINGS_COLLECTION).doc(id).update(updateData);

        const doc = await db.collection(WEDDINGS_COLLECTION).doc(id).get();
        const updatedWedding = { id: doc.id, ...doc.data() } as Wedding;

        revalidatePath('/admin/weddings');
        revalidatePath(`/${id}`);
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
            try {
                const filePath = path.join(process.cwd(), 'public', photo.imageUrl);
                fs.unlink(filePath).catch(err => console.warn(`Could not delete file ${filePath}:`, err));
            } catch(e) {
                console.warn("Error forming path for file deletion", e);
            }
            return doc.ref.delete();
        });
        await Promise.all(deletePromises);
        
        const weddingToDelete = await getWedding(id);
        if (weddingToDelete?.logoUrl) {
            try {
              const logoPath = path.join(process.cwd(), 'public', weddingToDelete.logoUrl);
              await fs.unlink(logoPath);
            } catch(e) {
                console.warn("Could not delete logo on wedding deletion", e);
            }
        }

        // Delete the wedding document itself
        await db.collection(WEDDINGS_COLLECTION).doc(id).delete();
        
        revalidatePath('/admin/weddings');
        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error("[DELETE_WEDDING_ERROR]", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido";
        return { success: false, message: `Falha ao excluir casamento: ${errorMessage}` };
    }
}


// --- Analytics Actions ---

export async function getAnalyticsData(): Promise<AnalyticsData> {
    try {
        const [weddingsSnapshot, photosSnapshot] = await Promise.all([
            db.collection(WEDDINGS_COLLECTION).get(),
            db.collection(PHOTOS_COLLECTION).get()
        ]);

        const weddings = weddingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wedding));
        const photos = photosSnapshot.docs.map(doc => doc.data() as Photo);

        // Calculate total stats
        const totalWeddings = weddings.length;
        const totalPhotos = photos.length;
        const totalLikes = photos.reduce((sum, photo) => sum + (photo.likes || 0), 0);
        const totalComments = photos.reduce((sum, photo) => sum + (photo.comments?.length || 0), 0);

        // Calculate photos per wedding
        const photosPerWedding = weddings.map(wedding => {
            const count = photos.filter(photo => photo.weddingId === wedding.id).length;
            return { name: wedding.coupleNames.split(' & ')[0], count };
        });

        // Calculate activity in the last 7 days
        const today = new Date();
        const activityLast7Days = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(today, i);
            const formattedDate = format(date, 'dd/MM');
            const count = photos.filter(photo => {
                const photoDate = new Date(photo.createdAt);
                return format(photoDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
            }).length;
            return { date: formattedDate, count };
        }).reverse();

        return {
            totalWeddings,
            totalPhotos,
            totalLikes,
            totalComments,
            photosPerWedding,
            activityLast7Days,
        };
    } catch (error) {
        console.error("Error fetching analytics data:", error);
        throw new Error("Could not retrieve analytics data.");
    }
}
