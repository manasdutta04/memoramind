import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { GlassCard } from '../components/GlassCard';
import { MoodBadge } from '../components/MoodBadge';
import { getDashboard } from '../lib/api';
import { getActiveElder, loadProfile } from '../lib/storage';
import type { DashboardResponse } from '../lib/types';

export function DashboardPage() {
  const params = useParams<{ elderId: string }>();
  const navigate = useNavigate();

  const elderId = useMemo(() => params.elderId ?? getActiveElder() ?? '', [params.elderId]);
  const profile = elderId ? loadProfile(elderId) : null;

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!elderId) {
      navigate('/');
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        const result = await getDashboard(elderId);
        if (!cancelled) {
          setData(result);
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
  }, [elderId, navigate]);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.14em] text-accent">Family Dashboard</p>
          <h1 className="text-3xl font-bold text-white">
            {data?.elder_name ?? (profile?.elder_name as string) ?? 'Loved One'} - Today
          </h1>
        </div>
        <button
          onClick={() => navigate(`/companion/${elderId}`)}
          className="rounded-xl border border-accent/40 px-4 py-2 text-sm font-semibold text-accent"
        >
          Open Companion
        </button>
      </header>

      {loading && <p className="text-slate-300">Loading dashboard...</p>}
      {error && <p className="text-rose-300">{error}</p>}

      {data && (
        <section className="grid gap-5 md:grid-cols-2">
          <GlassCard>
            <h2 className="text-lg font-semibold text-accent">Session Summary</h2>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-100">{data.summary}</p>
            <p className="mt-4 text-sm text-slate-400">Sessions today: {data.sessions_today}</p>
          </GlassCard>

          <GlassCard>
            <h2 className="text-lg font-semibold text-accent">Mood Indicator</h2>
            <div className="mt-4">
              <MoodBadge mood={data.mood} />
            </div>
            <p className="mt-4 text-sm text-slate-300">
              This reflects tone signals detected in today’s conversations.
            </p>
          </GlassCard>

          <GlassCard>
            <h2 className="text-lg font-semibold text-accent">Topics Mentioned</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.topics.length === 0 ? (
                <span className="text-sm text-slate-400">No topics captured yet.</span>
              ) : (
                data.topics.map((topic) => (
                  <span key={topic} className="rounded-full border border-accent/30 px-3 py-1 text-sm text-slate-100">
                    {topic}
                  </span>
                ))
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-lg font-semibold text-accent">Distress Alerts</h2>
            <div className="mt-4 grid gap-3">
              {data.distress_alerts.length === 0 ? (
                <p className="text-sm text-emerald-300">No distress alerts today.</p>
              ) : (
                data.distress_alerts.map((alert, index) => (
                  <p key={index} className="rounded-xl border border-rose-300/30 bg-rose-900/20 px-4 py-3 text-sm text-rose-100">
                    {alert}
                  </p>
                ))
              )}
            </div>
          </GlassCard>
        </section>
      )}
    </main>
  );
}
