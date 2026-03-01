import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'MemoraMind',
  description: 'Every memory matters.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-30 border-b-4 border-night bg-base">
          <nav className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5">
            <Link className="text-2xl font-black uppercase tracking-tighter" href="/">
              Memora<span className="text-primary">Mind</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link className="border-2 border-night px-4 py-2 text-sm font-bold uppercase transition hover:bg-night hover:text-white hover:shadow-brutal-sm" href="/family">
                My Family
              </Link>
              <a href="https://github.com/manasdutta04/memoramind" target="_blank" rel="noopener noreferrer" className="border-2 border-night px-4 py-2 text-sm font-bold uppercase transition hover:bg-night hover:text-white hover:shadow-brutal-sm">
                GitHub
              </a>
              <Link className="border-2 border-night px-4 py-2 text-sm font-bold uppercase transition hover:bg-night hover:text-white hover:shadow-brutal-sm" href="/settings">
                Voice Settings
              </Link>
            </div>
          </nav>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
