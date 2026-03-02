'use client';

type Props = {
  state: 'idle' | 'recording' | 'processing';
  disabled?: boolean;
  audioPlaying?: boolean;
  onClick: () => void;
};

export function MicButton({ state, disabled, audioPlaying, onClick }: Props) {
  const live = state === 'recording';
  const busy = state === 'processing';

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <button
          type="button"
          disabled={disabled || busy || audioPlaying}
          onClick={onClick}
          className={[
            'relative z-10 flex h-48 w-48 items-center justify-center rounded-full border-4 border-night text-xl font-black uppercase tracking-widest',
            'transition-all duration-150 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#111]',
            audioPlaying
              ? 'bg-accent text-night shadow-[6px_6px_0_0_#111]'
              : live
                ? 'mic-live bg-alert text-white shadow-[6px_6px_0_0_#111]'
                : 'mic-breath bg-primary text-white shadow-[6px_6px_0_0_#111]',
            busy && !audioPlaying ? 'opacity-70 bg-gray-200 text-night' : 'opacity-100'
          ].join(' ')}
        >
          {busy && !audioPlaying ? (
            <span className="block h-12 w-12 animate-spin rounded-full border-4 border-night border-t-transparent" />
          ) : audioPlaying ? (
            <div className="flex items-center gap-2">
              <div className="wave flex gap-1.5" aria-hidden>
                <span className="bg-night h-4" />
                <span className="bg-night h-6" />
                <span className="bg-night h-4" />
                <span className="bg-night h-8" />
                <span className="bg-night h-5" />
              </div>
            </div>
          ) : live ? (
            'Stop'
          ) : (
            'Speak'
          )}
        </button>

        {audioPlaying && (
          <div className="absolute inset-[-12px] -z-10 animate-pulse rounded-full border-4 border-accent/50 bg-accent/20" />
        )}
      </div>

      <div className="h-8">
        {audioPlaying && (
          <p className="text-sm font-black uppercase tracking-widest text-night animate-pulse">
            MemoraMind is Speaking...
          </p>
        )}
        {live && (
          <div className="wave flex gap-2 justify-center" aria-hidden>
            <span className="bg-alert" />
            <span className="bg-alert" />
            <span className="bg-alert" />
            <span className="bg-alert" />
            <span className="bg-alert" />
          </div>
        )}
      </div>
    </div>
  );
}

