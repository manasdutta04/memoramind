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
    <section className="mx-auto w-full max-w-4xl px-5 py-12">
      <GlassCard className="bg-white p-8 md:p-12">
        <div className="mb-10 flex flex-col justify-between border-b-4 border-night pb-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Family Setup</h1>
            <p className="mt-2 text-lg font-bold">Build a memory profile once, then start companion mode.</p>
          </div>
          <p className="mt-4 inline-block border-2 border-night bg-accent px-4 py-2 font-black uppercase shadow-brutal-sm md:mt-0 md:self-start">Step {progress}</p>
        </div>

        {step === 1 && (
          <div className="grid gap-6 md:grid-cols-2">
            <label className="flex flex-col gap-3 font-bold uppercase tracking-tight">
              Elder name
              <input
                className="border-4 border-night bg-white px-4 py-3 font-bold text-night placeholder:text-night/30 focus:outline-none focus:ring-4 focus:ring-accent"
                value={elderName}
                onChange={(event) => setElderName(event.target.value)}
                placeholder="Ramesh"
              />
            </label>
            <label className="flex flex-col gap-3 font-bold uppercase tracking-tight">
              Age
              <input
                className="border-4 border-night bg-white px-4 py-3 font-bold text-night focus:outline-none focus:ring-4 focus:ring-accent"
                type="number"
                min={40}
                max={120}
                value={age}
                onChange={(event) => setAge(Number(event.target.value))}
              />
            </label>

            <label className="flex flex-col gap-3 font-bold uppercase tracking-tight md:col-span-2">
              Preferred language
              <input
                className="border-4 border-night bg-white px-4 py-3 font-bold text-night placeholder:text-night/30 focus:outline-none focus:ring-4 focus:ring-accent"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                placeholder="English"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <input
                className="border-4 border-night bg-white px-4 py-3 font-bold text-night placeholder:text-night/30 focus:outline-none focus:ring-4 focus:ring-accent"
                placeholder="Family member name"
                value={memberName}
                onChange={(event) => setMemberName(event.target.value)}
              />
              <input
                className="border-4 border-night bg-white px-4 py-3 font-bold text-night placeholder:text-night/30 focus:outline-none focus:ring-4 focus:ring-accent"
                placeholder="Relationship"
                value={memberRelation}
                onChange={(event) => setMemberRelation(event.target.value)}
              />
              <button
                type="button"
                onClick={addFamilyMember}
                className="border-4 border-night bg-accent px-8 py-3 font-black uppercase text-night shadow-brutal transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
              >
                Add
              </button>
            </div>

            <div className="mt-8 grid gap-3">
              {familyMembers.length === 0 ? (
                <p className="font-bold text-gray-500">No members added yet.</p>
              ) : (
                familyMembers.map((member, index) => (
                  <div key={`${member.name}-${index}`} className="border-2 border-night bg-gray-100 px-4 py-3 font-bold shadow-brutal-sm">
                    {member.name} - {member.relationship}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-8">
            <label className="flex flex-col gap-3 font-bold uppercase tracking-tight">
              Key memories (one per line)
              <textarea
                rows={4}
                className="border-4 border-night bg-white px-4 py-3 font-bold text-night focus:outline-none focus:ring-4 focus:ring-accent"
                value={memories}
                onChange={(event) => setMemories(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-3 font-bold uppercase tracking-tight">
              Daily routine (one per line)
              <textarea
                rows={4}
                className="border-4 border-night bg-white px-4 py-3 font-bold text-night focus:outline-none focus:ring-4 focus:ring-accent"
                value={routine}
                onChange={(event) => setRoutine(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-3 font-bold uppercase tracking-tight">
              Favorite topics (one per line)
              <textarea
                rows={3}
                className="border-4 border-night bg-white px-4 py-3 font-bold text-night focus:outline-none focus:ring-4 focus:ring-accent"
                value={topics}
                onChange={(event) => setTopics(event.target.value)}
              />
            </label>
          </div>
        )}

        {error && <p className="mt-8 border-4 border-night bg-alert p-4 font-bold text-white shadow-brutal">{error}</p>}

        <div className="mt-12 flex items-center justify-between gap-4 border-t-4 border-night pt-8">
          <button
            type="button"
            disabled={step === 1 || loading}
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            className="border-4 border-night bg-white px-8 py-3 font-black uppercase text-night shadow-brutal transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50"
          >
            Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.min(TOTAL_STEPS, prev + 1))}
              disabled={loading || (step === 1 && !elderName.trim())}
              className="border-4 border-night bg-primary px-8 py-3 font-black uppercase text-white shadow-brutal transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-60"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || !elderName.trim()}
              onClick={submit}
              className="border-4 border-night bg-accent px-8 py-3 font-black uppercase text-night shadow-brutal transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Finish Setup'}
            </button>
          )}
        </div>
      </GlassCard>
    </section>
  );
}
