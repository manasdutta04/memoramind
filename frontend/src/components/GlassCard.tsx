import type { PropsWithChildren } from 'react';

export function GlassCard({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <section className={`glass rounded-3xl ${className}`}>{children}</section>;
}
