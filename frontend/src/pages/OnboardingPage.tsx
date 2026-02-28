import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { GlassCard } from '../components/GlassCard';
import { onboard } from '../lib/api';
import { saveProfile, setActiveElder } from '../lib/storage';
import type { FamilyMember, OnboardPayload } from '../lib/types';

function toLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

const totalSteps = 3;

export function OnboardingPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [elderName, setElderName] = useState('');
  const [age, setAge] = useState<number>(70);
  const [language, setLanguage] = useState('English');

  const [familyName, setFamilyName] = useState('');
  const [familyRelation, setFamilyRelation] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  const [memoriesText, setMemoriesText] = useState('');
  const [routineText, setRoutineText] = useState('');
  const [topicsText, setTopicsText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const progress = useMemo(() => `${step} / ${totalSteps}`, [step]);

  const addFamilyMember = () => {
    if (!familyName.trim() || !familyRelation.trim()) {
      return;
    }
    setFamilyMembers((prev) => [
      ...prev,
      { name: familyName.trim(), relationship: familyRelation.trim() }
    ]);
    setFamilyName('');
    setFamilyRelation('');
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setLoading(true);
      const payload: OnboardPayload = {
        elder_name: elderName,
        age,
        language,
        family_members: familyMembers,
        key_memories: toLines(memoriesText),
        daily_routine: toLines(routineText),
        favorite_topics: toLines(topicsText)
      };

      const result = await onboard(payload);
      setActiveElder(result.elder_id);
      saveProfile(result.elder_id, {
        elder_id: result.elder_id,
        elder_name: payload.elder_name,
        age: payload.age,
        language: payload.language,
        family_members: payload.family_members,
        key_memories: payload.key_memories,
        daily_routine: payload.daily_routine,
        favorite_topics: payload.favorite_topics
      });
      navigate(`/companion/${result.elder_id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <GlassCard className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Family Setup</h1>
            <p className="mt-2 text-slate-300">Create a memory profile for your loved one.</p>
          </div>
          <span className="rounded-xl border border-accent/40 px-3 py-1 text-sm text-accent">Step {progress}</span>
        </div>

        {step === 1 && (
          <section className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-200">
              Elder Name
              <input
                className="rounded-xl border border-accent/30 bg-black/30 p-3 text-white focus:border-accent"
                value={elderName}
                onChange={(event) => setElderName(event.target.value)}
                placeholder="e.g., Ramesh"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-slate-200">
              Age
              <input
                className="rounded-xl border border-accent/30 bg-black/30 p-3 text-white focus:border-accent"
                type="number"
                min={40}
                max={120}
                value={age}
                onChange={(event) => setAge(Number(event.target.value))}
              />
            </label>

            <label className="md:col-span-2 flex flex-col gap-2 text-sm text-slate-200">
              Preferred Language
              <input
                className="rounded-xl border border-accent/30 bg-black/30 p-3 text-white focus:border-accent"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                placeholder="English / Hindi / Tamil"
              />
            </label>
          </section>
        )}

        {step === 2 && (
          <section>
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <input
                className="rounded-xl border border-accent/30 bg-black/30 p-3 text-white"
                placeholder="Family member name"
                value={familyName}
                onChange={(event) => setFamilyName(event.target.value)}
              />
              <input
                className="rounded-xl border border-accent/30 bg-black/30 p-3 text-white"
                placeholder="Relationship"
                value={familyRelation}
                onChange={(event) => setFamilyRelation(event.target.value)}
              />
              <button
                type="button"
                onClick={addFamilyMember}
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-night"
              >
                Add
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {familyMembers.length === 0 ? (
                <p className="text-sm text-slate-400">No family members added yet.</p>
              ) : (
                familyMembers.map((member, index) => (
                  <div
                    key={`${member.name}-${index}`}
                    className="rounded-xl border border-accent/20 bg-black/20 px-4 py-3 text-sm text-slate-200"
                  >
                    {member.name} - {member.relationship}
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="grid gap-5">
            <label className="flex flex-col gap-2 text-sm text-slate-200">
              Key Life Memories (one per line)
              <textarea
                rows={4}
                className="rounded-xl border border-accent/30 bg-black/30 p-3 text-white"
                value={memoriesText}
                onChange={(event) => setMemoriesText(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-slate-200">
              Daily Routine (one per line)
              <textarea
                rows={4}
                className="rounded-xl border border-accent/30 bg-black/30 p-3 text-white"
                value={routineText}
                onChange={(event) => setRoutineText(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-slate-200">
              Favorite Topics (one per line)
              <textarea
                rows={3}
                className="rounded-xl border border-accent/30 bg-black/30 p-3 text-white"
                value={topicsText}
                onChange={(event) => setTopicsText(event.target.value)}
              />
            </label>
          </section>
        )}

        {error && <p className="mt-5 text-sm text-rose-300">{error}</p>}

        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1 || loading}
            className="rounded-xl border border-accent/40 px-5 py-2 text-sm text-accent disabled:opacity-50"
          >
            Back
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.min(totalSteps, prev + 1))}
              disabled={loading || (step === 1 && !elderName.trim())}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !elderName.trim()}
              className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-night disabled:opacity-50"
            >
              {loading ? 'Saving Profile...' : 'Finish Setup'}
            </button>
          )}
        </div>
      </GlassCard>
    </main>
  );
}
