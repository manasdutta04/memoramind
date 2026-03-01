'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';


import { GlassCard } from '@/components/GlassCard';
import { MoodBadge } from '@/components/MoodBadge';
import { MoodChart } from '@/components/MoodChart';
import { getDashboard } from '@/lib/api';
import { loadApiKeys, loadProfile, getConversationHistory } from '@/lib/storage';
import type { ApiKeys, DashboardResponse } from '@/lib/types';

export default function DashboardPage() {
  const params = useParams<{ elderId: string }>();
  const router = useRouter();
  const elderIdParam = params.elderId;
  const elderId = Array.isArray(elderIdParam) ? elderIdParam[0] : elderIdParam;

  const [keys, setKeys] = useState<ApiKeys>({ mistralKey: '', elevenLabsKey: '' });
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const profile = loadProfile(elderId);

  useEffect(() => {
    if (!elderId) {
      router.push('/');
      return;
    }
    const currentKeys = loadApiKeys();
    setKeys(currentKeys);

    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        const dashboard = await getDashboard(elderId, currentKeys);
        if (!cancelled) {
          setData(dashboard);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [elderId, router]);

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-10">


      <header className="mb-10 flex items-center justify-between border-b-4 border-night pb-6">
        <div>
          <p className="mb-2 inline-block bg-night px-2 py-1 text-xs font-bold uppercase tracking-widest text-white">Family Dashboard</p>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            {data?.elder_name ?? (profile?.elder_name as string) ?? 'Loved One'} — Today
          </h1>
        </div>
        <div className="flex gap-4">
          <Link
            className="border-4 border-night bg-white px-6 py-3 text-sm font-black uppercase text-night shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            href="/family"
          >
            ← My Family
          </Link>
          <Link
            className="border-4 border-night bg-primary px-6 py-3 text-sm font-black uppercase text-white shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            href={`/companion/${elderId}`}
          >
            Open Companion
          </Link>
        </div>
      </header>

      {loading && <p className="mb-8 font-bold text-night">Loading dashboard...</p>}
      {error && <p className="mb-8 border-4 border-night bg-alert p-4 font-bold text-white shadow-brutal">{error}</p>}

      {data && (
        <div className="flex flex-col gap-8">
          {/* Top row: Summary + Mood + Topics + Distress */}
          <div className="grid gap-8 md:grid-cols-2">
            <GlassCard className="bg-white">
              <h2 className="border-b-2 border-night pb-3 text-2xl font-black uppercase tracking-tighter">Session Summary</h2>
              <p className="mt-4 whitespace-pre-wrap text-lg font-medium leading-relaxed text-night">{data.summary}</p>
              <p className="mt-6 inline-block border-2 border-night bg-gray-100 px-3 py-1 text-sm font-bold uppercase shadow-brutal-sm">
                Sessions today: {data.sessions_today}
              </p>
            </GlassCard>

            <div className="flex flex-col gap-8">
              <GlassCard className="bg-white">
                <h2 className="border-b-2 border-night pb-3 text-2xl font-black uppercase tracking-tighter">Today&apos;s Mood</h2>
                <div className="mt-4 flex">
                  <MoodBadge mood={data.mood} />
                </div>
              </GlassCard>

              <GlassCard className="bg-white">
                <h2 className="border-b-2 border-night pb-3 text-2xl font-black uppercase tracking-tighter">Topics Discussed</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {data.topics.length === 0 ? (
                    <p className="font-bold text-gray-500">No topics captured yet.</p>
                  ) : (
                    data.topics.map((topic) => (
                      <span key={topic} className="border-2 border-night bg-accent px-3 py-1 text-sm font-bold uppercase shadow-brutal-sm">
                        {topic}
                      </span>
                    ))
                  )}
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Mood Timeline Chart */}
          <MoodChart conversations={getConversationHistory(elderId)} />

          {/* Daily Conversation Digest */}
          <GlassCard className="bg-white">
            <h2 className="border-b-2 border-night pb-3 text-2xl font-black uppercase tracking-tighter">Daily Digest</h2>
            {(() => {
              const convos = getConversationHistory(elderId);
              const today = new Date().toDateString();
              const todayConvos = convos.filter((c) => new Date(c.timestamp).toDateString() === today);
              if (todayConvos.length === 0) {
                return <p className="mt-4 font-bold text-night/50">No conversations today yet.</p>;
              }
              const moods = todayConvos.map((c) => c.mood);
              const allTopics = [...new Set(todayConvos.flatMap((c) => c.topics))];
              return (
                <div className="mt-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="border-2 border-night bg-green-50 p-4 shadow-brutal-sm">
                      <p className="text-3xl font-black">{todayConvos.length}</p>
                      <p className="text-sm font-bold uppercase text-night/60">Conversations</p>
                    </div>
                    <div className="border-2 border-night bg-blue-50 p-4 shadow-brutal-sm">
                      <p className="text-3xl font-black">{allTopics.length}</p>
                      <p className="text-sm font-bold uppercase text-night/60">Topics</p>
                    </div>
                    <div className="border-2 border-night bg-purple-50 p-4 shadow-brutal-sm">
                      <p className="text-lg font-black">{moods[moods.length - 1] ?? '—'}</p>
                      <p className="text-sm font-bold uppercase text-night/60">Latest Mood</p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-3">
                    <h3 className="font-black uppercase">Recent Exchanges</h3>
                    {todayConvos.slice(-5).reverse().map((c, i) => (
                      <div key={i} className="border-2 border-night/30 p-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-night/50">
                          <span>{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <MoodBadge mood={c.mood} />
                        </div>
                        <p className="mt-1 text-sm"><strong>Elder:</strong> {c.userText}</p>
                        <p className="mt-1 text-sm text-night/70"><strong>MemoraMind:</strong> {c.aiText.slice(0, 120)}{c.aiText.length > 120 ? '...' : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </GlassCard>

          {/* Distress Alerts */}
          <GlassCard className="bg-white">
            <h2 className="border-b-2 border-night pb-3 text-2xl font-black uppercase tracking-tighter">Distress Alerts</h2>
            <div className="mt-4 grid gap-4">
              {data.distress_alerts.length === 0 ? (
                <div className="border-2 border-night bg-green-50 p-4 font-bold shadow-brutal-sm">
                  ✓ No distress alerts today — wonderful!
                </div>
              ) : (
                data.distress_alerts.map((alert, index) => (
                  <p key={index} className="border-4 border-night bg-alert p-4 font-bold text-white shadow-brutal-sm">
                    ⚠ {alert}
                  </p>
                ))
              )}
            </div>
          </GlassCard>

          {/* Conversation Log */}
          {data.conversation_log && data.conversation_log.length > 0 && (
            <GlassCard className="bg-white">
              <h2 className="border-b-2 border-night pb-3 text-2xl font-black uppercase tracking-tighter">
                Conversation Log
              </h2>
              <p className="mt-1 text-sm font-bold uppercase text-night/50">Most recent first</p>
              <div className="mt-6 flex flex-col gap-6">
                {data.conversation_log.map((entry, i) => (
                  <div key={i} className="border-2 border-night p-5 shadow-brutal-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="border-2 border-night px-2 py-0.5 text-xs font-black uppercase shadow-brutal-sm">{entry.time}</span>
                      <MoodBadge mood={entry.mood} />
                      {entry.distress && (
                        <span className="border-2 border-night bg-alert px-2 py-0.5 text-xs font-black uppercase text-white shadow-brutal-sm">⚠ Distress</span>
                      )}
                    </div>
                    <div className="grid gap-3">
                      <div className="flex gap-3">
                        <span className="shrink-0 border-2 border-night bg-accent px-2 py-1 text-xs font-black uppercase shadow-brutal-sm">{data.elder_name}</span>
                        <p className="text-sm font-medium">{entry.user_text}</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="shrink-0 border-2 border-night bg-primary px-2 py-1 text-xs font-black uppercase text-white shadow-brutal-sm">MemoraMind</span>
                        <p className="text-sm font-medium">{entry.assistant_text}</p>
                      </div>
                    </div>
                    {entry.topics.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {entry.topics.map((t) => (
                          <span key={t} className="border border-night/40 bg-gray-100 px-2 py-0.5 text-xs font-bold">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </section>
  );
}
