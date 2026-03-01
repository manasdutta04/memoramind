const moodClasses: Record<string, string> = {
  Happy: 'border-night bg-[#86efac] text-night',
  Calm: 'border-night bg-[#7dd3fc] text-night',
  Confused: 'border-night bg-accent text-night',
  Distressed: 'border-night bg-alert text-white'
};

export function MoodBadge({ mood }: { mood: string }) {
  return (
    <span
      className={`inline-flex border-2 px-3 py-1 text-sm font-bold uppercase tracking-wider shadow-brutal-sm ${moodClasses[mood] ?? moodClasses.Calm
        }`}
    >
      {mood}
    </span>
  );
}
