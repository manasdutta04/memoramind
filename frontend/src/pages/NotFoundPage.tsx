import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-3xl flex-col items-center justify-center px-5 text-center">
      <h1 className="text-5xl font-extrabold text-white">404</h1>
      <p className="mt-4 text-slate-300">This page does not exist.</p>
      <Link to="/" className="mt-6 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-night">
        Back to Home
      </Link>
    </main>
  );
}
