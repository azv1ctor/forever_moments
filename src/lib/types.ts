
export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export type MediaType = 'image' | 'video';

export interface Photo {
  id: string;
  weddingId: string;
  imageUrl: string;
  caption: string;
  author: string;
  likes: number;
  comments: Comment[];
  createdAt: string;
  aiHint: string;
  filter?: string;
  mediaType: MediaType;
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
    planDetails: PlanDetails;
}
