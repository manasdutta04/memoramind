'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { GlassCard } from '@/components/GlassCard';
import { onboard } from '@/lib/api';
import { saveProfile, setActiveElder } from '@/lib/storage';
import type { FamilyMember, OnboardPayload } from '@/lib/types';

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [elderName, setElderName] = useState('');
  const [age, setAge] = useState(72);
  const [language, setLanguage] = useState('English');

  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  const [memories, setMemories] = useState('');
  const [routine, setRoutine] = useState('');
  const [topics, setTopics] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const progress = useMemo(() => `${step}/${TOTAL_STEPS}`, [step]);

  const addFamilyMember = () => {
    if (!memberName.trim() || !memberRelation.trim()) {
      return;
    }

    setFamilyMembers((prev) => [
      ...prev,
      { name: memberName.trim(), relationship: memberRelation.trim() }
    ]);
    setMemberName('');
    setMemberRelation('');
  };

  const submit = async () => {
    try {
      setLoading(true);
      setError('');

      const payload: OnboardPayload = {
        elder_name: elderName,
        age,
        language,
        family_members: familyMembers,
        key_memories: splitLines(memories),
        daily_routine: splitLines(routine),
        favorite_topics: splitLines(topics)
      };

      const response = await onboard(payload);
      setActiveElder(response.elder_id);
      saveProfile(response.elder_id, { ...payload, elder_id: response.elder_id });
      router.push(`/companion/${response.elder_id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-10">
      <GlassCard className="p-8">
        <div className="mb-7 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Family Setup</h1>
            <p className="mt-2 text-slate-300">Build a memory profile once, then start companion mode.</p>
          </div>
          <p className="rounded-xl border border-accent/40 px-3 py-1 text-sm text-accent">Step {progress}</p>
        </div>

        {step === 1 && (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              Elder name
              <input
                className="rounded-xl border border-accent/30 bg-black/30 px-3 py-3 text-white"
                value={elderName}
                onChange={(event) => setElderName(event.target.value)}
                placeholder="Ramesh"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Age
              <input
                className="rounded-xl border border-accent/30 bg-black/30 px-3 py-3 text-white"
                type="number"
                min={40}
                max={120}
                value={age}
                onChange={(event) => setAge(Number(event.target.value))}
              />
            </label>

            <label className="md:col-span-2 flex flex-col gap-2 text-sm">
              Preferred language
              <input
                className="rounded-xl border border-accent/30 bg-black/30 px-3 py-3 text-white"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                placeholder="English"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                className="rounded-xl border border-accent/30 bg-black/30 px-3 py-3 text-white"
                placeholder="Family member name"
                value={memberName}
                onChange={(event) => setMemberName(event.target.value)}
              />
              <input
                className="rounded-xl border border-accent/30 bg-black/30 px-3 py-3 text-white"
                placeholder="Relationship"
                value={memberRelation}
                onChange={(event) => setMemberRelation(event.target.value)}
              />
              <button
                type="button"
                onClick={addFamilyMember}
                className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-night"
              >
                Add
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {familyMembers.length === 0 ? (
                <p className="text-sm text-slate-400">No members added yet.</p>
              ) : (
                familyMembers.map((member, index) => (
                  <div key={`${member.name}-${index}`} className="rounded-xl border border-accent/20 bg-black/20 px-3 py-2 text-sm">
                    {member.name} - {member.relationship}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5">
            <label className="flex flex-col gap-2 text-sm">
              Key memories (one per line)
              <textarea
                rows={4}
                className="rounded-xl border border-accent/30 bg-black/30 px-3 py-3 text-white"
                value={memories}
                onChange={(event) => setMemories(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Daily routine (one per line)
              <textarea
                rows={4}
                className="rounded-xl border border-accent/30 bg-black/30 px-3 py-3 text-white"
                value={routine}
                onChange={(event) => setRoutine(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Favorite topics (one per line)
              <textarea
                rows={3}
                className="rounded-xl border border-accent/30 bg-black/30 px-3 py-3 text-white"
                value={topics}
                onChange={(event) => setTopics(event.target.value)}
              />
            </label>
          </div>
        )}

        {error && <p className="mt-5 text-sm text-rose-300">{error}</p>}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 1 || loading}
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            className="rounded-xl border border-accent/40 px-4 py-2 text-sm text-accent disabled:opacity-50"
          >
            Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.min(TOTAL_STEPS, prev + 1))}
              disabled={loading || (step === 1 && !elderName.trim())}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || !elderName.trim()}
              onClick={submit}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-night disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Finish Setup'}
            </button>
          )}
        </div>
      </GlassCard>
    </section>
  );
}
