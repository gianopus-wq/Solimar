import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

// Pages are pre-rendered in Node at build time, where there is no browser session to keep.
const inBrowser = typeof window !== 'undefined';

export const supabase = createClient(url, key, {
  auth: {
    persistSession: inBrowser,
    autoRefreshToken: inBrowser,
    detectSessionInUrl: inBrowser,
  },
});

export const BUCKET = {
  videos: 'intro-videos',
  agreements: 'agreements',
  contracts: 'contracts',
} as const;

export function videoUrl(path: string): string | undefined {
  return path ? supabase.storage.from(BUCKET.videos).getPublicUrl(path).data.publicUrl : undefined;
}

/** Storage keys must be plain ASCII without spaces. */
export function safeFileName(name: string): string {
  return name.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(-80) || 'file';
}
