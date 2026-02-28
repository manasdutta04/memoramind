'use client';

import { useCallback, useRef, useState } from 'react';

type RecorderState = 'idle' | 'recording' | 'processing';

export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setState('recording');
    } catch {
      setError('Microphone access was blocked. Please allow microphone permission.');
      setState('idle');
    }
  }, []);

  const stop = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== 'recording') {
        reject(new Error('Recorder is not active'));
        return;
      }

      setState('processing');
      recorder.onstop = () => {
        stopTracks();
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        setState('idle');
        resolve(blob);
      };

      recorder.stop();
    });
  }, [stopTracks]);

  return {
    state,
    error,
    start,
    stop,
    clearError: () => setError('')
  };
}
