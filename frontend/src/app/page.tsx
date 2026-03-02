'use client';

import { motion } from 'framer-motion';

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
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="h-full bg-white p-10 md:p-14">
            <p className="inline-block border-2 border-night bg-accent px-3 py-1 text-sm font-black uppercase tracking-widest shadow-brutal-sm">
              Voice-First Dementia Companion
            </p>
            <h1 className="mt-8 text-6xl font-black uppercase leading-none tracking-tighter md:text-8xl">Every memory matters.</h1>
            <p className="mt-8 max-w-2xl text-xl font-medium leading-relaxed md:text-2xl">
              MemoraMind gives older adults a warm companion that remembers who they are. Families add
              life memories once, then stay informed with a live care dashboard.
            </p>

            <div className="mt-12 flex flex-wrap gap-6">
              <button
                onClick={() => router.push('/family')}
                className="border-4 border-night bg-primary px-8 py-4 text-lg font-black uppercase text-white shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                Set Up for a Loved One
              </button>

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
          <GlassCard className="flex h-full flex-col justify-between bg-primary p-10 text-white md:p-14">
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

      {/* How it Works Section */}
      <section className="border-y-4 border-night bg-yellow-50 py-24">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="mb-16 text-center">
            <h2 className="text-5xl font-black uppercase tracking-tighter md:text-6xl">How it works</h2>
            <p className="mx-auto mt-6 max-w-2xl text-xl font-bold text-night/70">A seamless loop of care between the elderly and their families.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: "1. Family Setup", desc: "Relatives input memories, routines, and relationship details to personalize the AI.", color: "bg-white" },
              { title: "2. Voice Comfort", desc: "The elderly loved one simply pushes a button and speaks naturally with a familiar presence.", color: "bg-accent" },
              { title: "3. Live Insights", desc: "Families check the dashboard for mood, topics, and distress alerts in real-time.", color: "bg-primary text-white" }
            ].map((step, i) => (
              <div key={i} className={`border-4 border-night p-8 shadow-brutal ${step.color}`}>
                <h3 className="text-2xl font-black uppercase tracking-tight">{step.title}</h3>
                <p className="mt-4 text-lg font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="bg-primary py-24 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-5xl font-black uppercase tracking-tighter md:text-6xl text-white">Why MemoraMind?</h2>
            <p className="mt-6 text-xl font-medium leading-relaxed">
              Dementia isolates individuals by stealing context. MemoraMind restores that context by weaving highly personal memories into natural, emotionally resonant conversations.
            </p>
            <ul className="mt-8 space-y-6">
              {[
                { label: "Radically Personal", text: "Driven by custom Mistral capabilities, it doesn't just chat; it remembers who they are." },
                { label: "Emotional Anchor", text: "Designed to reduce anxiety loops by providing a calm, infinitely patient conversationalist." },
                { label: "Actionable Peace of Mind", text: "Because loving someone with dementia shouldn't mean worrying 24/7." }
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-white bg-night text-sm font-black shadow-brutal-sm">✓</div>
                  <div>
                    <h4 className="text-xl font-bold uppercase">{item.label}</h4>
                    <p className="mt-2 font-medium opacity-90">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-4 border-white bg-night p-10 shadow-[12px_12px_0_0_#fff]">
            <p className="text-xl font-bold italic leading-relaxed text-accent">
              &quot;My mother asks where my father is every afternoon. MemoraMind gently reminds her of the lovely garden he planted for her, shifting her distress into a warm memory.&quot;
            </p>
            <p className="mt-6 font-black uppercase tracking-widest text-white">— Beta Tester</p>
          </div>
        </div>
      </section>

      {/* Technical Architecture Section */}
      <section className="border-y-4 border-night bg-white py-24">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="mb-16">
            <h2 className="text-5xl font-black uppercase tracking-tighter md:text-6xl">Mistral Architecture</h2>
            <p className="mt-6 max-w-2xl text-xl font-bold text-night/70">
              Deep, native integration of Mistral's advanced capabilities for dementia care.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Cognitive Journal */}
            <div className="flex flex-col border-4 border-night bg-blue-50 shadow-[8px_8px_0_0_#111]">
              <div className="border-b-4 border-night bg-white p-4">
                <span className="bg-night px-2 py-1 text-xs font-black uppercase tracking-widest text-white">Function Calling</span>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-black uppercase tracking-tight">Cognitive Journal</h3>
                <p className="mt-4 font-medium leading-relaxed">
                  Mistral's powerful tool-calling API analyzes daily transcripts to generate a structured, clinical-grade
                  JSON object (emotional state, flagged moments, positive anchors) for the Family Dashboard in real-time.
                </p>
              </div>
            </div>

            {/* Emergency Interceptors */}
            <div className="flex flex-col border-4 border-night bg-red-50 shadow-[8px_8px_0_0_#111]">
              <div className="border-b-4 border-night bg-white p-4">
                <span className="bg-night px-2 py-1 text-xs font-black uppercase tracking-widest text-white">Tool Execution</span>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-black uppercase tracking-tight">Distress Detection</h3>
                <p className="mt-4 font-medium leading-relaxed">
                  The Mistral model doesn't just chat—it evaluates every utterance for severe physical or emotional
                  emergencies. If detected, it autonomously executes a tool call to trigger a family alert overlay.
                </p>
              </div>
            </div>

            {/* Context Engineering */}
            <div className="flex flex-col border-4 border-night bg-green-50 shadow-[8px_8px_0_0_#111]">
              <div className="border-b-4 border-night bg-white p-4">
                <span className="bg-night px-2 py-1 text-xs font-black uppercase tracking-widest text-white">Prompt Engineering</span>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-black uppercase tracking-tight">Memory Injection</h3>
                <p className="mt-4 font-medium leading-relaxed">
                  Dynamic memory retrieval. Mistral's system prompt is continuously rebuilt with the elder's
                  name, core life memories, daily routines, and family relationships to ground the AI in reality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t-4 border-night bg-base py-24">
        <div className="mx-auto w-full max-w-4xl px-5 text-center">
          <h2 className="text-5xl font-black uppercase tracking-tighter md:text-6xl">Bridge the memory gap.</h2>
          <p className="mt-6 text-xl font-medium text-night/70">
            A beautiful, respectful way to help older adults feel known and heard, every single day.
          </p>
          <div className="mt-12 flex justify-center gap-6">
            <button
              onClick={() => router.push('/family')}
              className="border-4 border-night bg-accent px-10 py-5 text-xl font-black uppercase text-night shadow-[8px_8px_0_0_#111] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              Start Care Hub
            </button>
          </div>
          <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t-4 border-night pt-8 md:flex-row">
            <p className="text-sm font-bold uppercase text-night/60">
              Built by <a href="https://github.com/manasdutta04" target="_blank" rel="noreferrer" className="text-night underline decoration-2 underline-offset-4 hover:bg-primary hover:text-white">Manas Dutta</a>
            </p>
            <p className="bg-night px-3 py-1 text-sm font-black uppercase tracking-widest text-white shadow-brutal-sm">
              Mistral Hackathon 2026
            </p>
            <a href="https://github.com/manasdutta04/memoramind" target="_blank" rel="noreferrer" className="text-sm font-bold uppercase text-night/60 hover:text-primary">
              Source Code
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
