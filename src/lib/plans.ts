// src/lib/plans.ts
import type { WeddingPlan, PlanDetails } from './types';

export interface Plan {
    name: WeddingPlan;
    description: string;
    price: {
        min: number;
        max: number;
    };
    features: PlanDetails;
    support: string;
}

export const defaultPlans: Record<WeddingPlan, Plan> = {
    'Básico': {
        name: 'Básico',
        description: 'O essencial para registrar e compartilhar os momentos do seu evento.',
        price: { min: 1000, max: 1500 },
        features: {
            allowFilters: false,
            allowGifs: false,
            tvCarousel: false,
            allowDownload: false,
            accessDurationDays: 90, // 3 months
        },
        support: 'Suporte básico durante o evento.'
    },
    'Premium': {
        name: 'Premium',
        description: 'Uma experiência mais rica com personalização e recursos interativos.',
        price: { min: 2000, max: 3000 },
        features: {
            allowFilters: true,
            allowGifs: false,
            tvCarousel: true,
            allowDownload: false,
            accessDurationDays: 365, // 1 year
        },
        support: 'Suporte premium e acompanhamento.'
    },
    'Deluxe': {
        name: 'Deluxe',
        description: 'A solução completa com todas as funcionalidades e máximo engajamento.',
        price: { min: 4000, max: 5000 },
        features: {
            allowFilters: true,
            allowGifs: true,
            tvCarousel: true,
            allowDownload: true,
            accessDurationDays: 0, // unlimited
        },
        support: 'Suporte completo com equipe no local.'
    }
};

let cachedPlans: Record<WeddingPlan, Plan> | null = null;

export function clearPlansCache() {
    cachedPlans = null;
}
