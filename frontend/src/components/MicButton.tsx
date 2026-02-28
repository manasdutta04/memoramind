import { motion } from 'framer-motion';

type Props = {
  state: 'idle' | 'recording' | 'processing';
  onClick: () => void;
  disabled?: boolean;
};

export function MicButton({ state, onClick, disabled = false }: Props) {
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.button
        whileTap={{ scale: disabled ? 1 : 0.96 }}
        onClick={onClick}
        disabled={disabled || isProcessing}
        className={[
          'relative flex h-52 w-52 items-center justify-center rounded-full border text-4xl font-bold transition',
          'focus:outline-none focus:ring-4 focus:ring-accent/60',
          isRecording
            ? 'mic-recording border-red-300 bg-red-500 text-white'
            : 'mic-breathing border-accent/40 bg-primary text-white',
          isProcessing ? 'opacity-70' : 'opacity-100'
        ].join(' ')}
        aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {isProcessing ? (
          <span className="h-14 w-14 animate-spin rounded-full border-4 border-accent/40 border-t-accent" />
        ) : isRecording ? (
          <span className="text-lg tracking-wide">Stop</span>
        ) : (
          <span className="text-lg tracking-wide">Speak</span>
        )}
      </motion.button>

      {isRecording && (
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
