'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { GlassCard } from '@/components/GlassCard';
import { loadDemo } from '@/lib/api';
import { getAllElders, removeElder, setActiveElder, saveProfile, registerElder, getLatestMood, getConversationHistory } from '@/lib/storage';
import type { ElderEntry } from '@/lib/storage';

export default function FamilyPage() {
    const router = useRouter();
    const [elders, setElders] = useState<ElderEntry[]>([]);
    const [loadingDemo, setLoadingDemo] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setElders(getAllElders());
    }, []);

    const handleRemove = (elderId: string, name: string) => {
        if (!confirm(`Remove ${name}? Their profile will be deleted from this browser.`)) return;
        removeElder(elderId);
        setElders(getAllElders());
    };

    const handleTalk = (elderId: string) => {
        setActiveElder(elderId);
        router.push(`/companion/${elderId}`);
    };

    const handleDemo = async () => {
        try {
            setError('');
            setLoadingDemo(true);
            const demo = await loadDemo();
            setActiveElder(demo.elder_id);
            saveProfile(demo.elder_id, demo.profile);
            registerElder({
                elderId: demo.elder_id,
                name: (demo.profile as Record<string, string>).elder_name || 'Demo Ramesh',
                age: Number((demo.profile as Record<string, number>).age) || 72,
                language: (demo.profile as Record<string, string>).language || 'English',
                addedAt: new Date().toISOString(),
            });
            setElders(getAllElders());
            router.push(`/companion/${demo.elder_id}`);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoadingDemo(false);
        }
    };

    return (
        <section className="mx-auto w-full max-w-6xl px-5 py-10">
            <header className="mb-10 flex flex-wrap items-center justify-between gap-6 border-b-4 border-night pb-8">
                <div>
                    <p className="mb-2 inline-block bg-night px-2 py-1 text-xs font-bold uppercase tracking-widest text-white">Caregiver Hub</p>
                    <h1 className="text-4xl font-black uppercase tracking-tight">My Family</h1>
                    <p className="mt-2 text-lg font-bold text-night/60">Manage your loved ones in one place.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Link
                        href="/onboarding"
                        className="border-4 border-night bg-primary px-6 py-3 font-black uppercase text-white shadow-brutal transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                    >
                        + Add New Person
                    </Link>
                    <button
                        onClick={handleDemo}
                        disabled={loadingDemo}
                        className="border-4 border-night bg-accent px-6 py-3 font-black uppercase text-night shadow-brutal transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50"
                    >
                        {loadingDemo ? 'Loading...' : 'Load Demo'}
                    </button>
                </div>
            </header>

            {error && <p className="mb-8 border-4 border-night bg-alert p-4 font-bold text-white shadow-brutal">{error}</p>}

            {/* Distress Alerts */}
            {elders.filter((e) => {
                const mood = getLatestMood(e.elderId);
                return mood && (mood.toLowerCase().includes('distress') || mood.toLowerCase().includes('anxious') || mood.toLowerCase().includes('scared'));
            }).map((e) => (
                <div key={`alert-${e.elderId}`} className="mb-6 flex items-center gap-4 border-4 border-alert bg-red-50 p-5 shadow-brutal animate-pulse">
                    <span className="text-3xl">🚨</span>
                    <div>
                        <p className="text-lg font-black uppercase text-alert">Distress Alert — {e.name}</p>
                        <p className="font-bold text-night/70">
                            {e.name} showed signs of distress in their last conversation. Consider reaching out or starting a companion session.
                        </p>
                    </div>
                    <button
                        onClick={() => handleTalk(e.elderId)}
                        className="ml-auto shrink-0 border-4 border-night bg-primary px-6 py-3 font-black uppercase text-white shadow-brutal-sm"
                    >
                        Talk Now
                    </button>
                </div>
            ))}

            {elders.length === 0 ? (
                <GlassCard className="flex flex-col items-center bg-white px-8 py-16 text-center">
                    <p className="text-6xl">👨‍👩‍👧‍👦</p>
                    <h2 className="mt-6 text-3xl font-black uppercase tracking-tight">No one added yet</h2>
                    <p className="mt-4 max-w-md text-lg font-medium text-night/60">
                        Add a loved one by clicking &quot;Add New Person&quot; above, or try the demo profile to explore how MemoraMind works.
                    </p>
                </GlassCard>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {elders.map((elder) => (
                        <GlassCard key={elder.elderId} className="flex flex-col bg-white p-6">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">{elder.name}</h3>
                                    <p className="mt-1 font-bold text-night/50">
                                        Age {elder.age} · {elder.language}
                                    </p>
                                </div>
                                {(() => {
                                    const mood = getLatestMood(elder.elderId);
                                    const convos = getConversationHistory(elder.elderId);
                                    return (
                                        <div className="text-right">
                                            {mood && (
                                                <span className={`inline-block border-2 border-night px-2 py-1 text-xs font-black uppercase shadow-brutal-sm ${mood.toLowerCase().includes('distress') || mood.toLowerCase().includes('anxious')
                                                        ? 'bg-alert text-white' : mood.toLowerCase().includes('happy')
                                                            ? 'bg-green-200' : 'bg-accent'
                                                    }`}>
                                                    {mood}
                                                </span>
                                            )}
                                            <p className="mt-1 text-xs font-bold text-night/40">{convos.length} conversations</p>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="mt-auto grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleTalk(elder.elderId)}
                                    className="border-4 border-night bg-primary px-4 py-3 font-black uppercase text-white shadow-brutal-sm transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                                >
                                    🎙️ Talk
                                </button>
                                <Link
                                    href={`/dashboard/${elder.elderId}`}
                                    className="border-4 border-night bg-white px-4 py-3 text-center font-black uppercase text-night shadow-brutal-sm transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                                >
                                    📊 Insights
                                </Link>
                            </div>

                            <button
                                onClick={() => handleRemove(elder.elderId, elder.name)}
                                className="mt-3 border-2 border-night/30 px-4 py-2 text-sm font-bold uppercase text-night/50 transition hover:border-alert hover:bg-alert hover:text-white"
                            >
                                Remove
                            </button>
                        </GlassCard>
                    ))}
                </div>
            )}
        </section>
    );
}
