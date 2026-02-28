import type { PropsWithChildren } from 'react';

export function GlassCard({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <section className={`glass-card rounded-3xl p-6 ${className}`}>{children}</section>;
}
