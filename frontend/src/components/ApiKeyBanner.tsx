'use client';

import Link from 'next/link';

import type { ApiKeys } from '@/lib/types';

export function ApiKeyBanner({ keys }: { keys: ApiKeys }) {
  if (keys.mistralKey.trim()) {
    return null;
  }

  return (
    <div className="glass mb-5 rounded-2xl border border-amber-300/30 px-4 py-3 text-sm text-amber-100">
      Add your own Mistral API key in{' '}
      <Link className="font-semibold underline" href="/settings">
        Settings
      </Link>{' '}
      to enable cloud responses.
    </div>
  );
}
