import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs';

import './globals.css';

export const metadata: Metadata = {
  title: 'MemoraMind',
  description: 'Every memory matters.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header className="sticky top-0 z-30 border-b border-accent/20 bg-night/80 backdrop-blur">
            <nav className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5">
              <Link className="text-xl font-extrabold tracking-tight" href="/">
                Memora<span className="text-accent">Mind</span>
              </Link>

              <div className="flex items-center gap-3">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="rounded-xl border border-accent/50 px-3 py-2 text-sm font-semibold text-accent">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-night">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>

                <SignedIn>
                  <Link className="rounded-xl border border-accent/40 px-3 py-2 text-sm font-semibold text-accent" href="/settings">
                    API Keys
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </nav>
          </header>

          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
