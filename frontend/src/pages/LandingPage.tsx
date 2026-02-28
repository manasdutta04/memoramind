import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { GlassCard } from '../components/GlassCard';
import { loadDemo } from '../lib/api';
import { saveProfile, setActiveElder } from '../lib/storage';

export function LandingPage() {
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [error, setError] = useState('');

  const handleDemo = async () => {
    try {
      setError('');
      setLoadingDemo(true);
      const demo = await loadDemo();
      setActiveElder(demo.elder_id);
      saveProfile(demo.elder_id, demo.profile);
      navigate(`/companion/${demo.elder_id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-5xl flex-col justify-center px-5 py-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
      >
        <GlassCard className="p-10">
          <p className="mb-3 inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Voice-First Dementia Companion
          </p>
          <h1 className="text-5xl font-extrabold tracking-tight text-white md:text-6xl">Every memory matters.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">
            MemoraMind helps older adults feel grounded and loved through warm, memory-aware conversations.
            Families stay informed with a simple daily well-being dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/onboarding')}
              className="rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-night transition hover:bg-white"
            >
              Set Up for a Loved One
            </button>
            <button
              onClick={handleDemo}
              disabled={loadingDemo}
              className="rounded-2xl border border-accent/60 bg-primary/70 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary disabled:opacity-60"
            >
              {loadingDemo ? 'Loading Demo...' : 'Try Demo'}
            </button>
          </div>

          {error && <p className="mt-5 text-sm text-rose-300">{error}</p>}
        </GlassCard>

        <GlassCard className="flex flex-col justify-between p-8">
          <div>
            <h2 className="text-xl font-semibold text-accent">Why this matters</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-200">
              Dementia is rising rapidly, and emotional orientation support can reduce anxiety in daily life.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-accent/20 bg-black/20 p-5">
            <p className="text-4xl font-bold text-white">~8.8 million</p>
            <p className="mt-2 text-sm text-slate-200">people in India are estimated to be living with dementia.</p>
            <p className="mt-3 text-xs text-slate-400">Source note: Alzheimer’s Disease International (India estimate), 2024.</p>
          </div>
        </GlassCard>
      </motion.section>
    </main>
  );
}
