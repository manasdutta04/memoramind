const moodClasses: Record<string, string> = {
  Happy: 'border-emerald-300/40 bg-emerald-400/20 text-emerald-100',
  Calm: 'border-sky-300/40 bg-sky-400/20 text-sky-100',
  Confused: 'border-amber-300/40 bg-amber-400/20 text-amber-100',
  Distressed: 'border-rose-300/40 bg-rose-500/25 text-rose-100'
};

export function MoodBadge({ mood }: { mood: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${
        moodClasses[mood] ?? moodClasses.Calm
      }`}
    >
      {mood}
    </span>
  );
}
