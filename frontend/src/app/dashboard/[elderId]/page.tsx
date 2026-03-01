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

      <header className="mb-10 flex items-center justify-between border-b-4 border-night pb-6">
        <div>
          <p className="mb-2 inline-block bg-night px-2 py-1 text-xs font-bold uppercase tracking-widest text-white">Family Dashboard</p>
          <h1 className="text-4xl font-black uppercase tracking-tight">{data?.elder_name ?? (profile?.elder_name as string) ?? 'Loved One'} - Today</h1>
        </div>

        <Link className="border-4 border-night bg-primary px-6 py-3 text-sm font-black uppercase text-white shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none" href={`/companion/${elderId}`}>
          Open Companion
        </Link>
      </header>

      {loading && <p className="mb-8 font-bold text-night">Loading dashboard...</p>}
      {error && <p className="mb-8 border-4 border-night bg-alert p-4 font-bold text-white shadow-brutal">{error}</p>}

      {data && (
        <div className="grid gap-8 md:grid-cols-2">
          <GlassCard className="bg-white">
            <h2 className="border-b-2 border-night pb-3 text-2xl font-black uppercase tracking-tighter">Session Summary</h2>
            <p className="mt-4 whitespace-pre-wrap text-lg font-medium leading-relaxed text-night">{data.summary}</p>
            <p className="mt-6 inline-block border-2 border-night bg-gray-100 px-3 py-1 font-bold uppercase text-sm shadow-brutal-sm">Sessions today: {data.sessions_today}</p>
          </GlassCard>

          <GlassCard className="bg-white">
            <h2 className="border-b-2 border-night pb-3 text-2xl font-black uppercase tracking-tighter">Mood Indicator</h2>
            <div className="mt-6 flex">
              <MoodBadge mood={data.mood} />
            </div>
          </GlassCard>

          <GlassCard className="bg-white">
            <h2 className="border-b-2 border-night pb-3 text-2xl font-black uppercase tracking-tighter">Topics Mentioned</h2>
            <div className="mt-6 flex flex-wrap gap-3">
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

          <GlassCard className="bg-white">
            <h2 className="border-b-2 border-night pb-3 text-2xl font-black uppercase tracking-tighter">Distress Alerts</h2>
            <div className="mt-6 grid gap-4">
              {data.distress_alerts.length === 0 ? (
                <p className="font-bold text-green-600">No distress alerts today.</p>
              ) : (
                data.distress_alerts.map((alert, index) => (
                  <p key={index} className="border-4 border-night bg-alert p-4 font-bold text-white shadow-brutal-sm">
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
