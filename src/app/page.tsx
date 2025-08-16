import { redirect } from 'next/navigation';

// This page is no longer used directly.
// Users will go to /[weddingId]
// Redirecting to admin for convenience during development.
export default function RootPage() {
  redirect('/admin');
}
