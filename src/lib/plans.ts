// src/lib/plans.ts
'use server';
import type { WeddingPlan, PlanDetails } from './types';
import fs from 'fs/promises';
import path from 'path';

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

const defaultPlans: Record<WeddingPlan, Plan> = {
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

const PLANS_CONFIG_PATH = path.join(process.cwd(), 'public', 'plans.json');

let cachedPlans: Record<WeddingPlan, Plan> | null = null;

export async function getPlans(): Promise<Record<WeddingPlan, Plan>> {
    if (cachedPlans) {
        return cachedPlans;
    }
    try {
        await fs.access(PLANS_CONFIG_PATH);
        const fileContent = await fs.readFile(PLANS_CONFIG_PATH, 'utf-8');
        cachedPlans = JSON.parse(fileContent);
        return cachedPlans!;
    } catch (error) {
        // Se o arquivo não existe ou há erro na leitura/parse, usa o padrão e o cria
        console.log("Arquivo de planos não encontrado ou inválido, usando e criando o padrão.");
        try {
            await fs.writeFile(PLANS_CONFIG_PATH, JSON.stringify(defaultPlans, null, 2), 'utf-8');
        } catch (writeError) {
            console.error("Erro ao tentar criar o arquivo de planos padrão:", writeError);
        }
        cachedPlans = defaultPlans;
        return cachedPlans;
    }
}
