type Props = { mood: string };

const moodMap: Record<string, string> = {
  Happy: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/40',
  Calm: 'bg-sky-400/20 text-sky-200 border-sky-300/40',
  Confused: 'bg-amber-400/20 text-amber-200 border-amber-300/40',
  Distressed: 'bg-rose-500/25 text-rose-100 border-rose-300/40'
};

export function MoodBadge({ mood }: Props) {
  const classes = moodMap[mood] ?? moodMap.Calm;
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${classes}`}>{mood}</span>
  );
}
