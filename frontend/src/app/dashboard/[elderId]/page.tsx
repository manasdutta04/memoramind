'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ApiKeyBanner } from '@/components/ApiKeyBanner';
import { GlassCard } from '@/components/GlassCard';
import { MoodBadge } from '@/components/MoodBadge';
import { getDashboard } from '@/lib/api';
import { loadApiKeys, loadProfile } from '@/lib/storage';
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
      <ApiKeyBanner keys={keys} />

      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Family Dashboard</p>
          <h1 className="text-3xl font-bold">{data?.elder_name ?? (profile?.elder_name as string) ?? 'Loved One'} - Today</h1>
        </div>

        <Link className="rounded-xl border border-accent/50 px-4 py-2 text-sm text-accent" href={`/companion/${elderId}`}>
          Open Companion
        </Link>
      </header>

      {loading && <p className="text-slate-300">Loading dashboard...</p>}
      {error && <p className="text-rose-300">{error}</p>}

      {data && (
        <div className="grid gap-5 md:grid-cols-2">
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-accent">Session Summary</h2>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-100">{data.summary}</p>
            <p className="mt-4 text-sm text-slate-400">Sessions today: {data.sessions_today}</p>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-accent">Mood Indicator</h2>
            <div className="mt-4">
              <MoodBadge mood={data.mood} />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-accent">Topics Mentioned</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.topics.length === 0 ? (
                <p className="text-sm text-slate-400">No topics captured yet.</p>
              ) : (
                data.topics.map((topic) => (
                  <span key={topic} className="rounded-full border border-accent/30 px-3 py-1 text-sm">
                    {topic}
                  </span>
                ))
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-accent">Distress Alerts</h2>
            <div className="mt-4 grid gap-3">
              {data.distress_alerts.length === 0 ? (
                <p className="text-sm text-emerald-300">No distress alerts today.</p>
              ) : (
                data.distress_alerts.map((alert, index) => (
                  <p key={index} className="rounded-xl border border-rose-300/30 bg-rose-900/20 px-3 py-2 text-sm">
                    {alert}
                  </p>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </section>
  );
}
