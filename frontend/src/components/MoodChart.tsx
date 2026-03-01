'use client';

import type { ConversationEntry } from '@/lib/storage';

const MOOD_COLORS: Record<string, string> = {
    happy: '#22c55e',
    calm: '#3b82f6',
    nostalgic: '#a855f7',
    confused: '#f59e0b',
    anxious: '#f97316',
    distressed: '#ef4444',
    sad: '#6366f1',
};

const MOOD_EMOJI: Record<string, string> = {
    happy: '😊',
    calm: '😌',
    nostalgic: '💭',
    confused: '😕',
    anxious: '😰',
    distressed: '😢',
    sad: '😔',
};

function getMoodColor(mood: string): string {
    const lower = mood.toLowerCase();
    for (const [key, color] of Object.entries(MOOD_COLORS)) {
        if (lower.includes(key)) return color;
    }
    return '#94a3b8';
}

function getMoodEmoji(mood: string): string {
    const lower = mood.toLowerCase();
    for (const [key, emoji] of Object.entries(MOOD_EMOJI)) {
        if (lower.includes(key)) return emoji;
    }
    return '🙂';
}

interface MoodChartProps {
    conversations: ConversationEntry[];
}

export function MoodChart({ conversations }: MoodChartProps) {
    const recent = conversations.slice(-10);

    if (recent.length === 0) {
        return (
            <div className="border-4 border-night bg-gray-50 p-6 text-center shadow-brutal">
                <p className="font-bold text-night/50">No conversations yet — start talking to see mood trends.</p>
            </div>
        );
    }

    return (
        <div className="border-4 border-night bg-white p-6 shadow-brutal">
            <h3 className="mb-6 text-xl font-black uppercase tracking-tight">Mood Timeline</h3>
            <div className="flex items-end gap-2" style={{ height: '140px' }}>
                {recent.map((c, i) => {
                    const color = getMoodColor(c.mood);
                    const emoji = getMoodEmoji(c.mood);
                    const height = 40 + (i / recent.length) * 60 + Math.random() * 20;
                    const time = new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1">
                            <span className="text-lg">{emoji}</span>
                            <div
                                className="w-full rounded-t-sm border-2 border-night transition-all"
                                style={{ height: `${height}px`, backgroundColor: color }}
                                title={`${c.mood} — ${time}`}
                            />
                            <span className="text-[10px] font-bold text-night/50">{time}</span>
                        </div>
                    );
                })}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
                {Object.entries(MOOD_COLORS).map(([mood, color]) => (
                    <span key={mood} className="flex items-center gap-1 text-xs font-bold uppercase">
                        <span className="inline-block h-3 w-3 border border-night" style={{ backgroundColor: color }} />
                        {mood}
                    </span>
                ))}
            </div>
        </div>
    );
}
