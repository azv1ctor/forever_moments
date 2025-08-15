export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  imageUrl: string;
  caption: string;
  author: string;
  likes: number;
  comments: Comment[];
  createdAt: string;
  aiHint: string;
  filter?: string;
}

    