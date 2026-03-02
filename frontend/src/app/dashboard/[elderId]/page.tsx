'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { GlassCard } from '@/components/GlassCard';
import { MoodBadge } from '@/components/MoodBadge';
import { MoodChart } from '@/components/MoodChart';
import { getCognitiveJournal, getDashboard } from '@/lib/api';
import { getConversationHistory, loadApiKeys, loadProfile } from '@/lib/storage';
import type { ApiKeys, CognitiveJournalResponse, DashboardResponse } from '@/lib/types';

// Cognitive Score Gauge
function CognitiveScoreGauge({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 7 ? '#22c55e' : score >= 4 ? '#f59e0b' : '#ef4444';
  const label =
    score >= 7 ? 'Strong Engagement' : score >= 4 ? 'Moderate' : 'Needs Attention';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black">{score}</span>
          <span className="text-xs font-bold uppercase text-night/50">/ 10</span>
        </div>
      </div>
      <span className="border-2 border-night px-2 py-0.5 text-xs font-black uppercase" style={{ backgroundColor: color + '20' }}>
        {label}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const params = useParams<{ elderId: string }>();
  const router = useRouter();
  const elderIdParam = params.elderId;
  const elderId = Array.isArray(elderIdParam) ? elderIdParam[0] : elderIdParam;

  const [keys, setKeys] = useState<ApiKeys>({ mistralKey: '', elevenLabsKey: '' });
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [journal, setJournal] = useState<CognitiveJournalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [journalLoading, setJournalLoading] = useState(true);
  const [journalError, setJournalError] = useState('');
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
        if (!cancelled) setLoading(false);
      }
    }

    async function runJournal() {
      try {
        setJournalLoading(true);
        const j = await getCognitiveJournal(elderId, currentKeys);
        if (!cancelled) {
          setJournal(j);
          setJournalError('');
        }
      } catch (err) {
        if (!cancelled) setJournalError((err as Error).message);
      } finally {
        if (!cancelled) setJournalLoading(false);
      }
    }

    run();
    runJournal();
    return () => { cancelled = true; };
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

      <div className="flex flex-col gap-8">
        {/* ─── Cognitive Journal ─── */}
        <GlassCard className="bg-gradient-to-br from-primary to-night p-0 text-white overflow-hidden">
          <div className="border-b-4 border-white/20 px-8 py-5 flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Cognitive Journal</h2>
              <p className="text-xs font-bold uppercase text-white/60">AI-powered daily health analysis · Powered by Mistral</p>
            </div>
          </div>

          {journalLoading ? (
            <div className="p-8 flex items-center gap-3">
              <div className="h-5 w-5 animate-spin border-2 border-white border-t-transparent rounded-full" />
              <span className="font-bold text-white/70">Mistral is analyzing today&apos;s conversations…</span>
            </div>
          ) : journal ? (
            <div className="p-8 grid gap-8 md:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-6">
                {/* Emotional Summary */}
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-white/50">Emotional Summary</p>
                  <p className="text-lg font-medium leading-relaxed text-white">{journal.emotional_summary}</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Flagged Moments */}
                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-red-300">⚠ Flagged Moments</p>
                    {journal.flagged_moments.length === 0 ? (
                      <p className="font-bold text-green-300">✓ No concerning moments today</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {journal.flagged_moments.map((m, i) => (
                          <li key={i} className="border-2 border-red-400/40 bg-red-500/20 px-4 py-2 text-sm font-medium text-white">
                            {m}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Positive Anchors */}
                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-widest text-green-300">✦ Positive Anchors</p>
                    {journal.positive_anchors.length === 0 ? (
                      <p className="font-bold text-white/50">None identified yet</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {journal.positive_anchors.map((a, i) => (
                          <li key={i} className="border-2 border-green-400/40 bg-green-500/20 px-4 py-2 text-sm font-medium text-white">
                            {a}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Recommended Actions */}
                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-widest text-yellow-300">→ Recommended Actions</p>
                  <ul className="flex flex-col gap-2">
                    {journal.recommended_actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-3 border-2 border-white/20 bg-white/10 px-4 py-3 text-sm font-medium">
                        <span className="mt-0.5 h-5 w-5 shrink-0 border-2 border-white/40 flex items-center justify-center text-xs font-black">
                          {i + 1}
                        </span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right: Score + Stats */}
              <div className="flex flex-col items-center gap-6 border-l-4 border-white/20 pl-8">
                <div className="text-center">
                  <p className="mb-3 text-xs font-black uppercase tracking-widest text-white/50">Cognitive Vitality</p>
                  <CognitiveScoreGauge score={journal.cognitive_score} />
                </div>
                <div className="border-2 border-white/20 bg-white/10 px-6 py-4 text-center w-full">
                  <p className="text-4xl font-black">{journal.engagements}</p>
                  <p className="text-xs font-bold uppercase text-white/50">Conversations</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8">
              {journalError ? (
                <p className="font-bold text-red-300">Journal Error: {journalError}</p>
              ) : (
                <p className="font-bold text-white/60">Journal unavailable. Ensure your Mistral API key is set in Settings.</p>
              )}
            </div>
          )}
        </GlassCard>

        {/* ─── Classic Dashboard ─── */}
        {data && (
          <>
            {/* Top row: Summary + Mood + Topics */}
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
          </>
        )}
      </div>
    </section>
  );
}
