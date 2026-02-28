'use client';

type Props = {
  state: 'idle' | 'recording' | 'processing';
  disabled?: boolean;
  onClick: () => void;
};

export function MicButton({ state, disabled, onClick }: Props) {
  const live = state === 'recording';
  const busy = state === 'processing';

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={onClick}
        className={[
          'relative flex h-52 w-52 items-center justify-center rounded-full border text-lg font-semibold tracking-wide',
          'transition focus:outline-none focus:ring-4 focus:ring-accent/50',
          live ? 'mic-live border-rose-300 bg-rose-500 text-white' : 'mic-breath border-accent/50 bg-primary text-white',
          busy ? 'opacity-70' : 'opacity-100'
        ].join(' ')}
      >
        {busy ? (
          <span className="h-14 w-14 animate-spin rounded-full border-4 border-accent/40 border-t-accent" />
        ) : live ? (
          'Stop'
        ) : (
          'Speak'
        )}
      </button>

      {live && (
        <div className="wave flex gap-1" aria-hidden>
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
