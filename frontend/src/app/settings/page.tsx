'use client';

import Link from 'next/link';

import { GlassCard } from '@/components/GlassCard';
import { getActiveElder } from '@/lib/storage';

export default function SettingsPage() {
  const elderId = getActiveElder();

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-12">
      <GlassCard className="bg-white p-8 md:p-12">
        <h1 className="border-b-4 border-night pb-6 text-4xl font-black uppercase tracking-tight">Settings</h1>

        <div className="mt-8 border-2 border-night bg-green-50 p-6 shadow-brutal-sm">
          <p className="text-lg font-bold">✓ No configuration needed</p>
          <p className="mt-2 font-medium text-night/70">
            All AI services (voice recognition, conversation, and speech) are pre-configured and ready to use.
          </p>
        </div>

        {elderId && (
          <div className="mt-8">
            <Link
              href={`/companion/${elderId}`}
              className="border-4 border-night bg-primary px-6 py-3 font-black uppercase text-white shadow-brutal transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
            >
              Back to Companion
            </Link>
          </div>
        )}
      </GlassCard>
    </section>
  );
}
