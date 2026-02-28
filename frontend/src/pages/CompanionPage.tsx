import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { MicButton } from '../components/MicButton';
import { MoodBadge } from '../components/MoodBadge';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { chatWithVoice } from '../lib/api';
import { getActiveElder, loadProfile, saveProfile } from '../lib/storage';
import type { VoiceChatResponse } from '../lib/types';

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function CompanionPage() {
  const params = useParams<{ elderId: string }>();
  const navigate = useNavigate();

  const elderId = params.elderId ?? getActiveElder() ?? '';
  const profile = elderId ? loadProfile(elderId) : null;

  const elderName = asString(profile?.elder_name, 'Dear Friend');
  const language = asString(profile?.language, 'English');

  const recorder = useVoiceRecorder();
  const [loadingReply, setLoadingReply] = useState(false);
  const [error, setError] = useState('');
  const [subtitle, setSubtitle] = useState('Tap the button and speak. I am here with you.');
  const [transcript, setTranscript] = useState('');
  const [mood, setMood] = useState('Calm');
  const [topics, setTopics] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');

  const micState = useMemo(() => {
    if (loadingReply || recorder.state === 'processing') {
      return 'processing' as const;
    }
    return recorder.state;
  }, [loadingReply, recorder.state]);

  useEffect(() => {
    if (!elderId) {
      navigate('/');
      return;
    }

    if (!profile) {
      saveProfile(elderId, { elder_id: elderId, elder_name: elderName, language });
    }
  }, [elderId, elderName, language, navigate, profile]);

  const speakFallback = (text: string) => {
    if (!window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language.toLowerCase().includes('hindi') ? 'hi-IN' : 'en-US';
    utterance.rate = 0.93;
    utterance.pitch = 1;
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

  const processResponse = async (payload: VoiceChatResponse) => {
    setSubtitle(payload.assistant_text);
    setTranscript(payload.transcript);
    setMood(payload.mood);
    setTopics(payload.topics || []);
    await playAudio(payload);
  };

  const sendAudio = async (audioBlob: Blob) => {
    try {
      setError('');
      setLoadingReply(true);
      const payload = await chatWithVoice({ elderId, audioBlob });
      await processResponse(payload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingReply(false);
    }
  };

  const handleMicClick = async () => {
    if (loadingReply) {
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

    recorder.resetError();
    await recorder.start();
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim() || loadingReply) {
      return;
    }
    try {
      setLoadingReply(true);
      setError('');
      const payload = await chatWithVoice({ elderId, userText: textInput });
      await processResponse(payload);
      setTextInput('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingReply(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-5xl flex-col px-5 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-accent">Companion Mode</p>
          <h1 className="text-3xl font-bold text-white">Hello, {elderName}</h1>
        </div>
        <button
          onClick={() => navigate(`/dashboard/${elderId}`)}
          className="rounded-xl border border-accent/50 px-4 py-2 text-sm font-medium text-accent"
        >
          Family Dashboard
        </button>
      </header>

      <section className="glass-card flex flex-1 flex-col items-center justify-center rounded-3xl px-6 py-10 text-center">
        <p className="mb-6 text-lg text-slate-300">Press once to talk, press again to send.</p>

        <MicButton state={micState} onClick={handleMicClick} disabled={!elderId} />

        <div className="mt-10 max-w-3xl rounded-3xl border border-accent/20 bg-black/25 px-6 py-5">
          <p className="text-[22px] leading-relaxed text-white">{subtitle}</p>
          {transcript && <p className="mt-4 text-lg text-slate-300">You said: {transcript}</p>}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-base text-slate-200">
          <MoodBadge mood={mood} />
          {topics.slice(0, 3).map((topic) => (
            <span key={topic} className="rounded-full border border-accent/30 px-3 py-1 text-sm">
              {topic}
            </span>
          ))}
        </div>

        <div className="mt-8 w-full max-w-3xl rounded-2xl border border-accent/20 bg-black/25 p-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Backup text mode (for demo reliability)</p>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="flex-1 rounded-xl border border-accent/30 bg-black/30 px-3 py-3 text-base text-white"
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              placeholder="Type a message if microphone is unavailable"
            />
            <button
              onClick={handleTextSubmit}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Send
            </button>
          </div>
        </div>

        {(error || recorder.error) && (
          <p className="mt-5 text-sm text-rose-300">{error || recorder.error}</p>
        )}
      </section>
    </main>
  );
}
