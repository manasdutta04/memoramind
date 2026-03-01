'use client';

import Link from 'next/link';

import type { ApiKeys } from '@/lib/types';

export function ApiKeyBanner({ keys }: { keys: ApiKeys }) {
  if (keys.mistralKey.trim()) {
    return null;
  }

  return (
    <div className="mb-8 border-4 border-night bg-accent p-4 text-sm font-bold text-night shadow-brutal">
      <span className="mr-2 uppercase tracking-widest">Notice:</span>
      Add your own Mistral API key in{' '}
      <Link className="underline decoration-2 underline-offset-4 hover:bg-night hover:text-white" href="/settings">
        Settings
      </Link>{' '}
      to enable cloud responses.
    </div>
  );
}
