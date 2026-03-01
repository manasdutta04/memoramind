'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { GlassCard } from '@/components/GlassCard';
import { MicButton } from '@/components/MicButton';
import { MoodBadge } from '@/components/MoodBadge';
import { chatWithVoice } from '@/lib/api';
import { loadApiKeys, loadProfile } from '@/lib/storage';
import { useVoiceRecorder } from '@/lib/useVoiceRecorder';
import type { ApiKeys, ChatMessage, VoiceChatResponse } from '@/lib/types';



function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CompanionPage() {
  const params = useParams<{ elderId: string }>();
  const router = useRouter();
  const elderIdParam = params.elderId;
  const elderId = Array.isArray(elderIdParam) ? elderIdParam[0] : elderIdParam;

  const [keys, setKeys] = useState<ApiKeys>({ mistralKey: '', elevenLabsKey: '' });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [llmNotice, setLlmNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [elderName, setElderName] = useState('Dear Friend');
  const [language, setLanguage] = useState('English');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recorder = useVoiceRecorder();

  useEffect(() => {
    if (!elderId) {
      router.push('/');
      return;
    }
    const currentKeys = loadApiKeys();
    setKeys(currentKeys);

    const profile = loadProfile(elderId);
    if (typeof profile?.elder_name === 'string' && profile.elder_name.trim()) {
      setElderName(profile.elder_name.trim());
    }
    if (typeof profile?.language === 'string' && profile.language.trim()) {
      setLanguage(profile.language.trim());
    }
  }, [elderId, router]);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const micState = useMemo(() => {
    if (loading || recorder.state === 'processing') {
      return 'processing' as const;
    }
    return recorder.state;
  }, [loading, recorder.state]);



  const speakFallback = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const isHindi = language.toLowerCase().includes('hindi');
    utterance.lang = isHindi ? 'hi-IN' : 'en-US';

    // Pick the best available voice — prefer warm female voices
    const voices = window.speechSynthesis.getVoices();
    const preferredNames = isHindi
      ? ['Lekha', 'Google हिन्दी', 'Neerja']
      : ['Samantha', 'Karen', 'Google UK English Female', 'Moira', 'Tessa', 'Fiona', 'Victoria'];

    let bestVoice = voices.find((v) =>
      preferredNames.some((name) => v.name.includes(name))
    );
    if (!bestVoice) {
      bestVoice = voices.find(
        (v) => v.lang.startsWith(isHindi ? 'hi' : 'en') && v.name.toLowerCase().includes('female')
      );
    }
    if (!bestVoice) {
      bestVoice = voices.find((v) => v.lang.startsWith(isHindi ? 'hi' : 'en'));
    }
    if (bestVoice) utterance.voice = bestVoice;

    utterance.rate = 0.88;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Ensure voices are loaded (some browsers load them async)
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.getVoices();
  }

  const playAudio = async (payload: VoiceChatResponse) => {
    console.log('[TTS Debug]', {
      tts_fallback: payload.tts_fallback,
      has_audio: !!payload.audio_base64,
      audio_length: payload.audio_base64?.length ?? 0,
      mime: payload.audio_mime_type,
    });

    if (payload.audio_base64 && payload.audio_mime_type) {
      try {
        const source = `data:${payload.audio_mime_type};base64,${payload.audio_base64}`;
        const player = new Audio(source);
        await player.play();
        return;
      } catch (err) {
        console.warn('[TTS Debug] ElevenLabs audio playback failed, using fallback:', err);
        speakFallback(payload.assistant_text);
        return;
      }
    }
    console.warn('[TTS Debug] No ElevenLabs audio — using browser fallback');
    speakFallback(payload.assistant_text);
  };

  const processReply = async (userText: string, payload: VoiceChatResponse) => {
    const now = Date.now();

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userText, timestamp: now - 1 },
      {
        role: 'assistant',
        text: payload.assistant_text,
        mood: payload.mood,
        distress: payload.distress,
        topics: payload.topics,
        timestamp: now,
      },
    ]);

    if (payload.llm_fallback) {
      setLlmNotice(payload.llm_error ? `Fallback mode: ${payload.llm_error}` : 'Fallback mode is active.');
    } else {
      setLlmNotice('');
    }

    await playAudio(payload);
  };

  const sendAudio = async (audioBlob: Blob) => {

    try {
      setLoading(true);
      setError('');
      const payload = await chatWithVoice({ elderId, audioBlob, keys });
      await processReply(payload.transcript, payload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleMic = async () => {
    if (loading) return;
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
    const text = textInput.trim();
    if (!text) return;

    try {
      setLoading(true);
      setError('');
      const payload = await chatWithVoice({ elderId, userText: text, keys });
      await processReply(text, payload);
      setTextInput('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-8">
      <header className="mb-8 flex items-center justify-between gap-4 border-b-4 border-night pb-6">
        <div>
          <p className="mb-2 inline-block bg-night px-2 py-1 text-xs font-bold uppercase tracking-widest text-white">Companion Mode</p>
          <h1 className="text-4xl font-black tracking-tight">Hello, {elderName}</h1>
        </div>
        <Link href={`/dashboard/${elderId}`} className="border-4 border-night bg-primary px-4 py-2 text-sm font-bold uppercase text-white shadow-brutal-sm transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
          Dashboard
        </Link>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left: Mic + last reply */}
        <GlassCard className="flex flex-col items-center bg-white p-8 text-center">
          <p className="mb-8 text-base font-bold uppercase tracking-wide text-night/60">
            Press once to talk, press again to send.
          </p>
          <MicButton state={micState} onClick={handleMic} disabled={false} />

          {lastAssistant ? (
            <div className="mt-10 w-full border-4 border-night bg-yellow-50 px-6 py-6 shadow-brutal">
              <p className="text-2xl font-bold leading-snug">{lastAssistant.text}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <MoodBadge mood={lastAssistant.mood ?? 'Calm'} />
                {(lastAssistant.topics ?? []).slice(0, 3).map((t) => (
                  <span key={t} className="border-2 border-night bg-accent px-2 py-0.5 text-xs font-bold uppercase shadow-brutal-sm">{t}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-10 w-full border-4 border-night bg-base px-6 py-6 shadow-brutal">
              <p className="text-2xl font-bold leading-snug text-night/60">Tap the button and speak. I am here with you.</p>
            </div>
          )}

          {/* Text fallback */}
          <div className="mt-8 w-full border-4 border-night bg-white p-5 shadow-brutal-sm">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-night/50">Backup text mode</p>
            {llmNotice && <p className="mb-3 text-sm font-bold uppercase text-alert">{llmNotice}</p>}
            <div className="flex gap-3">
              <input
                className="flex-1 border-4 border-night px-4 py-3 font-bold placeholder:text-night/40 focus:outline-none focus:ring-4 focus:ring-accent"
                value={textInput}
                onChange={(event) => setTextInput(event.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleText()}
                placeholder="Type a message…"
              />
              <button onClick={handleText} className="border-4 border-night bg-primary px-6 py-3 font-black uppercase text-white shadow-brutal transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
                Send
              </button>
            </div>
          </div>

          {(error || recorder.error) && (
            <p className="mt-6 w-full border-4 border-night bg-alert p-4 font-bold text-white shadow-brutal">
              {error || recorder.error}
            </p>
          )}
        </GlassCard>

        {/* Right: Scrollable conversation history */}
        <GlassCard className="flex flex-col bg-white p-0">
          <div className="border-b-4 border-night px-5 py-4">
            <h2 className="text-lg font-black uppercase tracking-tight">Session Log</h2>
            <p className="text-xs font-bold uppercase text-night/50">{messages.length} turns today</p>
          </div>

          <div className="flex flex-1 flex-col-reverse gap-4 overflow-y-auto p-5" style={{ maxHeight: '600px' }}>
            <div ref={chatEndRef} />
            {[...messages].reverse().map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[90%] border-2 px-4 py-3 text-sm font-medium shadow-brutal-sm ${msg.role === 'user'
                    ? 'border-night bg-accent text-night'
                    : 'border-night bg-white text-night'
                    }`}
                >
                  {msg.text}
                </div>
                <p className="mt-1 px-1 text-xs font-bold text-night/40">
                  {msg.role === 'user' ? elderName : 'MemoraMind'} · {formatTime(msg.timestamp)}
                </p>
              </div>
            ))}

            {messages.length === 0 && (
              <p className="text-center text-sm font-bold text-night/40">No messages yet. Start talking!</p>
            )}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
