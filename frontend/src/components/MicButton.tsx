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
          'relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-night text-xl font-black uppercase tracking-widest',
          'transition-all duration-150 focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#111]',
          live
            ? 'mic-live bg-alert text-white shadow-[6px_6px_0_0_#111]'
            : 'mic-breath bg-primary text-white shadow-[6px_6px_0_0_#111]',
          busy ? 'opacity-70 bg-gray-200 text-night' : 'opacity-100'
        ].join(' ')}
      >
        {busy ? (
          <span className="block h-12 w-12 animate-spin rounded-full border-4 border-night border-t-transparent" />
        ) : live ? (
          'Stop'
        ) : (
          'Speak'
        )}
      </button>

      {live && (
        <div className="wave flex gap-2" aria-hidden>
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
