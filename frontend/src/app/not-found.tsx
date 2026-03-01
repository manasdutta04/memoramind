import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl flex-col items-center justify-center px-5 text-center">
      <h1 className="text-9xl font-black uppercase tracking-tighter">404</h1>
      <p className="mt-6 text-2xl font-bold">This page does not exist.</p>
      <Link href="/" className="mt-10 border-4 border-night bg-primary px-8 py-4 text-lg font-black uppercase text-white shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
        Back to Home
      </Link>
    </section>
  );
}
