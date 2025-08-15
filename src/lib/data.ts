import type { Photo } from '@/lib/types';

// In-memory data store. Resets on server restart.
export const photos: Photo[] = [
  {
    id: '1',
    imageUrl: 'https://placehold.co/600x800.png',
    aiHint: 'wedding couple kiss',
    caption: 'So happy to celebrate with these two! Such a beautiful moment.',
    author: 'Aunt Carol',
    likes: 15,
    comments: [
      { id: 'c1', author: 'Uncle Bob', text: 'Beautiful photo!', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      { id: 'c2', author: 'Cousin Sarah', text: 'What a magical day!', createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    filter: 'filter-saturate-150'
  },
  {
    id: '2',
    imageUrl: 'https://placehold.co/600x600.png',
    aiHint: 'wedding cake',
    caption: 'The cake was almost too pretty to eat... almost! 🎂',
    author: 'John (Best Man)',
    likes: 22,
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    filter: 'filter-none'
  },
  {
    id: '3',
    imageUrl: 'https://placehold.co/800x600.png',
    aiHint: 'wedding party dance',
    caption: 'Dancing the night away with the best people!',
    author: 'Emily (Bridesmaid)',
    likes: 31,
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    filter: 'filter-grayscale'
  },
    {
    id: '4',
    imageUrl: 'https://placehold.co/600x700.png',
    aiHint: 'bride groom smiling',
    caption: 'Pure happiness!',
    author: 'Guest 1',
    likes: 45,
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    filter: 'filter-sepia'
  },
];

    