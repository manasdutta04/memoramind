'use client';

import { motion } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { GlassCard } from '@/components/GlassCard';
import { loadDemo } from '@/lib/api';
import { saveProfile, setActiveElder } from '@/lib/storage';

export default function LandingPage() {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [error, setError] = useState('');

  const handleDemo = async () => {
    try {
      setError('');
      setLoadingDemo(true);
      const demo = await loadDemo();
      setActiveElder(demo.elder_id);
      saveProfile(demo.elder_id, demo.profile);
      router.push(`/companion/${demo.elder_id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <section className="mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-6xl gap-6 px-5 py-10 lg:grid-cols-[1.2fr_0.8fr]">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="p-10">
          <p className="inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Voice-First Dementia Companion
          </p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight md:text-6xl">Every memory matters.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">
            MemoraMind gives older adults a warm companion that remembers who they are. Families add
            life memories once, then stay informed with a live care dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <SignedIn>
              <button
                onClick={() => router.push('/onboarding')}
                className="rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-night"
              >
                Set Up for a Loved One
              </button>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-night">
                  Set Up for a Loved One
                </button>
              </SignInButton>
            </SignedOut>

            <button
              onClick={handleDemo}
              disabled={loadingDemo}
              className="rounded-2xl border border-accent/60 bg-primary/70 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loadingDemo ? 'Loading Demo...' : 'Try Demo'}
            </button>
          </div>

          {error && <p className="mt-5 text-sm text-rose-300">{error}</p>}
        </GlassCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard className="flex h-full flex-col justify-between p-8">
          <div>
            <h2 className="text-xl font-semibold text-accent">India impact snapshot</h2>
            <p className="mt-4 text-slate-200">
              Early emotional support can reduce distress episodes in dementia care.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-accent/20 bg-black/25 p-5">
            <p className="text-4xl font-bold">~8.8 million</p>
            <p className="mt-2 text-sm text-slate-200">people in India are estimated to be living with dementia.</p>
            <p className="mt-3 text-xs text-slate-400">Source note: Alzheimer&apos;s Disease International (India estimate), 2024.</p>
          </div>
        </GlassCard>
      </motion.div>
    </section>
  );
}
