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
    <section className="mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1.2fr_0.8fr]">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="h-full p-10 md:p-14">
          <p className="inline-block border-2 border-night bg-accent px-3 py-1 text-sm font-black uppercase tracking-widest shadow-brutal-sm">
            Voice-First Dementia Companion
          </p>
          <h1 className="mt-8 text-6xl font-black uppercase leading-none tracking-tighter md:text-8xl">Every memory matters.</h1>
          <p className="mt-8 max-w-2xl text-xl font-medium leading-relaxed md:text-2xl">
            MemoraMind gives older adults a warm companion that remembers who they are. Families add
            life memories once, then stay informed with a live care dashboard.
          </p>

          <div className="mt-12 flex flex-wrap gap-6">
            <SignedIn>
              <button
                onClick={() => router.push('/onboarding')}
                className="border-4 border-night bg-primary px-8 py-4 text-lg font-black uppercase text-white shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                Set Up for a Loved One
              </button>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="border-4 border-night bg-primary px-8 py-4 text-lg font-black uppercase text-white shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
                  Set Up for a Loved One
                </button>
              </SignInButton>
            </SignedOut>

            <button
              onClick={handleDemo}
              disabled={loadingDemo}
              className="border-4 border-night bg-white px-8 py-4 text-lg font-black uppercase text-night shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-50"
            >
              {loadingDemo ? 'Loading...' : 'Try Demo'}
            </button>
          </div>

          {error && <p className="mt-6 border-2 border-night bg-alert p-3 font-bold text-white shadow-brutal-sm">{error}</p>}
        </GlassCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard className="flex h-full flex-col justify-between bg-primary text-white p-10 md:p-14">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">India impact snapshot</h2>
            <p className="mt-6 text-xl font-medium leading-relaxed">
              Early emotional support can reduce distress episodes in dementia care.
            </p>
          </div>

          <div className="mt-12 border-4 border-white bg-transparent p-8">
            <p className="text-6xl font-black tracking-tighter md:text-7xl">~8.8M</p>
            <p className="mt-4 text-lg font-bold">people in India are estimated to be living with dementia.</p>
            <p className="mt-6 text-sm font-medium opacity-80">Source note: Alzheimer&apos;s Disease International (India estimate), 2024.</p>
          </div>
        </GlassCard>
      </motion.div>
    </section>
  );
}
