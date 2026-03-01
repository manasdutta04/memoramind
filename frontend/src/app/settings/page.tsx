'use client';

import { useEffect, useState } from 'react';

import { GlassCard } from '@/components/GlassCard';
import { loadApiKeys, saveApiKeys } from '@/lib/storage';

export default function SettingsPage() {
  const [mistralKey, setMistralKey] = useState('');
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = loadApiKeys();
    setMistralKey(stored.mistralKey);
    setElevenLabsKey(stored.elevenLabsKey);
  }, []);

  const handleSave = () => {
    saveApiKeys({ mistralKey: mistralKey.trim(), elevenLabsKey: elevenLabsKey.trim() });
    setMessage('Saved in your browser for this account session on this device.');
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-12">
      <GlassCard className="bg-white p-8 md:p-12">
        <h1 className="border-b-4 border-night pb-6 text-4xl font-black uppercase tracking-tight">API Key Settings</h1>
        <p className="mt-8 text-lg font-bold">
          Enter your own provider keys. Keys are sent as request headers and are not committed to project files.
        </p>

        <div className="mt-10 grid gap-8">
          <label className="flex flex-col gap-3 font-bold uppercase tracking-tight">
            Mistral API Key (required for cloud responses)
            <input
              type="password"
              value={mistralKey}
              onChange={(event) => setMistralKey(event.target.value)}
              placeholder="Paste your Mistral key"
              className="border-4 border-night bg-white px-4 py-3 font-bold text-night placeholder:text-night/30 focus:outline-none focus:ring-4 focus:ring-accent"
            />
          </label>

          <label className="flex flex-col gap-3 font-bold uppercase tracking-tight">
            ElevenLabs API Key (optional, browser voice fallback works without this)
            <input
              type="password"
              value={elevenLabsKey}
              onChange={(event) => setElevenLabsKey(event.target.value)}
              placeholder="Paste your ElevenLabs key"
              className="border-4 border-night bg-white px-4 py-3 font-bold text-night placeholder:text-night/30 focus:outline-none focus:ring-4 focus:ring-accent"
            />
          </label>
        </div>

        <div className="mt-12 flex items-center gap-6 border-t-4 border-night pt-8">
          <button
            type="button"
            onClick={handleSave}
            className="border-4 border-night bg-primary px-8 py-3 font-black uppercase text-white shadow-brutal transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
          >
            Save Keys
          </button>
          {message && <span className="border-2 border-night bg-accent px-4 py-2 font-bold shadow-brutal-sm">{message}</span>}
        </div>
      </GlassCard>
    </section>
  );
}
