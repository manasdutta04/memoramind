import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl flex-col items-center justify-center px-5 text-center">
      <h1 className="text-5xl font-extrabold">404</h1>
      <p className="mt-3 text-slate-300">This page does not exist.</p>
      <Link href="/" className="mt-6 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-night">
        Back to Home
      </Link>
    </section>
  );
}
