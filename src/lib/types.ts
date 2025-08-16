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
export type WeddingStatus = 'Ativo' | 'Inativo' | 'Concluído' | 'Pendente';

export interface Wedding {
    id: string;
    coupleNames: string;
    date: string;
    plan: WeddingPlan;
    price: number;
    status: WeddingStatus;
    createdAt: string;
    logoUrl?: string; // <-- Adicionado para logo personalizada
}
