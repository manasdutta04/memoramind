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
          <header className="sticky top-0 z-30 border-b-4 border-night bg-base">
            <nav className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5">
              <Link className="text-2xl font-black uppercase tracking-tighter" href="/">
                Memora<span className="text-primary">Mind</span>
              </Link>

              <div className="flex items-center gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="border-2 border-night px-4 py-2 text-sm font-bold uppercase transition hover:bg-night hover:text-white hover:shadow-brutal-sm">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="border-2 border-night bg-primary px-4 py-2 text-sm font-bold uppercase text-white shadow-brutal-sm transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>

                <SignedIn>
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
