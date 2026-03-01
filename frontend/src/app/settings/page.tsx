'use client';

import { useEffect, useState } from 'react';

import { GlassCard } from '@/components/GlassCard';
import { loadApiKeys, saveApiKeys } from '@/lib/storage';

export default function SettingsPage() {
    const [elevenLabsKey, setElevenLabsKey] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const stored = loadApiKeys();
        setElevenLabsKey(stored.elevenLabsKey);
    }, []);

    const handleSave = () => {
        const stored = loadApiKeys();
        saveApiKeys({ ...stored, elevenLabsKey: elevenLabsKey.trim() });
        setMessage(elevenLabsKey.trim() ? 'ElevenLabs key saved — premium voice active!' : 'Cleared — using default voice.');
    };

    return (
        <section className="mx-auto w-full max-w-3xl px-5 py-12">
            <GlassCard className="bg-white p-8 md:p-12">
                <h1 className="border-b-4 border-night pb-6 text-4xl font-black uppercase tracking-tight">Voice Settings</h1>

                <div className="mt-8 border-2 border-night bg-green-50 p-6 shadow-brutal-sm">
                    <p className="text-lg font-bold">✓ Default voice works out of the box</p>
                    <p className="mt-2 font-medium text-night/70">
                        MemoraMind uses high-quality Microsoft neural voices by default — no API key needed.
                    </p>
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-black uppercase tracking-tight">Optional: Premium Voice</h2>
                    <p className="mt-2 font-medium text-night/70">
                        For even more natural-sounding voice, add your own{' '}
                        <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="underline decoration-2 underline-offset-4 hover:text-primary">
                            ElevenLabs
                        </a>{' '}
                        API key. Free tier gives 10,000 characters/month.
                    </p>

                    <label className="mt-6 flex flex-col gap-3 font-bold uppercase tracking-tight">
                        ElevenLabs API Key (optional)
                        <input
                            type="password"
                            value={elevenLabsKey}
                            onChange={(event) => setElevenLabsKey(event.target.value)}
                            placeholder="sk_xxxxxxxxxxxxx"
                            className="border-4 border-night bg-white px-4 py-3 font-bold text-night placeholder:text-night/30 focus:outline-none focus:ring-4 focus:ring-accent"
                        />
                    </label>
                </div>

                <div className="mt-10 flex items-center gap-6 border-t-4 border-night pt-8">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="border-4 border-night bg-primary px-8 py-3 font-black uppercase text-white shadow-brutal transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                    >
                        Save
                    </button>
                    {message && <span className="border-2 border-night bg-accent px-4 py-2 font-bold shadow-brutal-sm">{message}</span>}
                </div>
            </GlassCard>
        </section>
    );
}
