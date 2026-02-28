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
    <section className="mx-auto w-full max-w-3xl px-5 py-10">
      <GlassCard className="p-8">
        <h1 className="text-3xl font-bold">API Key Settings</h1>
        <p className="mt-3 text-slate-300">
          Enter your own provider keys. Keys are sent as request headers and are not committed to project files.
        </p>

        <div className="mt-6 grid gap-5">
          <label className="flex flex-col gap-2 text-sm">
            Mistral API Key (required for cloud responses)
            <input
              type="password"
              value={mistralKey}
              onChange={(event) => setMistralKey(event.target.value)}
              placeholder="Paste your Mistral key"
              className="rounded-xl border border-accent/30 bg-black/30 px-3 py-3 text-white"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            ElevenLabs API Key (optional, browser voice fallback works without this)
            <input
              type="password"
              value={elevenLabsKey}
              onChange={(event) => setElevenLabsKey(event.target.value)}
              placeholder="Paste your ElevenLabs key"
              className="rounded-xl border border-accent/30 bg-black/30 px-3 py-3 text-white"
            />
          </label>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-night"
          >
            Save Keys
          </button>
          {message && <span className="text-sm text-emerald-300">{message}</span>}
        </div>
      </GlassCard>
    </section>
  );
}
