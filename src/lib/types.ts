
export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  weddingId: string; // <-- Adicionado para isolar fotos por casamento
  imageUrl: string;
  caption: string;
  author: string;
  likes: number;
  comments: Comment[];
  createdAt: string;
  aiHint: string;
  filter?: string;
}

export type WeddingPlan = 'Básico' | 'Premium' | 'Deluxe';
export type WeddingStatus = 'Ativo' | 'Inativo';

export interface PlanDetails {
    allowFilters: boolean;
    allowGifs: boolean;
    tvCarousel: boolean;
    allowDownload: boolean;
    accessDurationDays: number; // 0 for unlimited
}

export interface Wedding {
    id: string;
    coupleNames: string;
    date: string;
    plan: WeddingPlan;
    price: number;
    status: WeddingStatus;
    createdAt: string;
    logoUrl?: string;
    planDetails: PlanDetails; // Snapshot of plan features at creation time
}
