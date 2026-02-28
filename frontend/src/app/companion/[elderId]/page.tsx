'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ApiKeyBanner } from '@/components/ApiKeyBanner';
import { GlassCard } from '@/components/GlassCard';
import { MicButton } from '@/components/MicButton';
import { MoodBadge } from '@/components/MoodBadge';
import { chatWithVoice } from '@/lib/api';
import { loadApiKeys, loadProfile } from '@/lib/storage';
import { useVoiceRecorder } from '@/lib/useVoiceRecorder';
import type { ApiKeys, VoiceChatResponse } from '@/lib/types';

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export default function CompanionPage() {
  const params = useParams<{ elderId: string }>();
  const router = useRouter();
  const elderIdParam = params.elderId;
  const elderId = Array.isArray(elderIdParam) ? elderIdParam[0] : elderIdParam;

  const [keys, setKeys] = useState<ApiKeys>({ mistralKey: '', elevenLabsKey: '' });
  const [subtitle, setSubtitle] = useState('Tap the button and speak. I am here with you.');
  const [transcript, setTranscript] = useState('');
  const [mood, setMood] = useState('Calm');
  const [topics, setTopics] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [llmNotice, setLlmNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const recorder = useVoiceRecorder();
  const profile = loadProfile(elderId);
  const elderName = asString(profile?.elder_name, 'Dear Friend');
  const language = asString(profile?.language, 'English');

  useEffect(() => {
    if (!elderId) {
      router.push('/');
      return;
    }
    setKeys(loadApiKeys());
  }, [elderId, router]);

  const micState = useMemo(() => {
    if (loading || recorder.state === 'processing') {
      return 'processing' as const;
    }
    return recorder.state;
  }, [loading, recorder.state]);

  const hasMistralKey = keys.mistralKey.trim().length > 0;

  const speakFallback = (text: string) => {
    if (!window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language.toLowerCase().includes('hindi') ? 'hi-IN' : 'en-US';
    utterance.rate = 0.93;
    window.speechSynthesis.speak(utterance);
  };

  const playAudio = async (payload: VoiceChatResponse) => {
    if (payload.audio_base64 && payload.audio_mime_type) {
      try {
        const source = `data:${payload.audio_mime_type};base64,${payload.audio_base64}`;
        const player = new Audio(source);
        await player.play();
        return;
      } catch {
        speakFallback(payload.assistant_text);
        return;
      }
    }
    speakFallback(payload.assistant_text);
  };

  const processReply = async (payload: VoiceChatResponse) => {
    setSubtitle(payload.assistant_text);
    setTranscript(payload.transcript);
    setMood(payload.mood);
    setTopics(payload.topics || []);

    if (payload.llm_fallback) {
      setLlmNotice(payload.llm_error ? `Fallback mode: ${payload.llm_error}` : 'Fallback mode is active.');
    } else {
      setLlmNotice('');
    }

    await playAudio(payload);
  };

  const sendAudio = async (audioBlob: Blob) => {
    if (!hasMistralKey) {
      setError('Add your Mistral key in Settings to continue.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = await chatWithVoice({ elderId, audioBlob, keys });
      await processReply(payload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleMic = async () => {
    if (loading) {
      return;
    }

    if (recorder.state === 'recording') {
      try {
        const blob = await recorder.stop();
        await sendAudio(blob);
      } catch (err) {
        setError((err as Error).message);
      }
      return;
    }

    recorder.clearError();
    await recorder.start();
  };

  const handleText = async () => {
    if (!textInput.trim()) {
      return;
    }
    if (!hasMistralKey) {
      setError('Add your Mistral key in Settings to continue.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = await chatWithVoice({ elderId, userText: textInput, keys });
      await processReply(payload);
      setTextInput('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-8">
      <ApiKeyBanner keys={keys} />

      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Companion Mode</p>
          <h1 className="text-3xl font-bold">Hello, {elderName}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/${elderId}`} className="rounded-xl border border-accent/50 px-4 py-2 text-sm text-accent">
            Family Dashboard
          </Link>
          <button
            onClick={() => router.push('/settings')}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold"
          >
            Settings
          </button>
        </div>
      </header>

      <GlassCard className="flex min-h-[72vh] flex-col items-center justify-center p-8 text-center">
        <p className="mb-6 text-lg text-slate-200">Press once to talk, press again to send.</p>

        <MicButton state={micState} onClick={handleMic} disabled={!hasMistralKey} />

        <div className="mt-10 w-full max-w-3xl rounded-3xl border border-accent/20 bg-black/25 px-6 py-5">
          <p className="text-[22px] leading-relaxed">{subtitle}</p>
          {transcript && <p className="mt-4 text-lg text-slate-300">You said: {transcript}</p>}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <MoodBadge mood={mood} />
          {topics.slice(0, 4).map((topic) => (
            <span key={topic} className="rounded-full border border-accent/30 px-3 py-1 text-sm">
              {topic}
            </span>
          ))}
        </div>

        <div className="mt-8 w-full max-w-3xl rounded-2xl border border-accent/20 bg-black/25 p-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Backup text mode</p>
          {llmNotice && <p className="mb-2 text-xs text-amber-300">{llmNotice}</p>}
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="flex-1 rounded-xl border border-accent/30 bg-black/30 px-3 py-3"
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              placeholder="Type message when mic is unavailable"
            />
            <button onClick={handleText} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold">
              Send
            </button>
          </div>
        </div>

        {(error || recorder.error) && <p className="mt-5 text-sm text-rose-300">{error || recorder.error}</p>}
      </GlassCard>
    </section>
  );
}
