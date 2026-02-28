import { AnimatePresence } from 'framer-motion';
import { Link, Route, Routes, useLocation } from 'react-router-dom';

import { RouteTransition } from './components/RouteTransition';
import { CompanionPage } from './pages/CompanionPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OnboardingPage } from './pages/OnboardingPage';

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen text-slate-100">
      <header className="sticky top-0 z-30 border-b border-accent/15 bg-night/80 backdrop-blur">
        <nav className="mx-auto flex h-[88px] w-full max-w-6xl items-center justify-between px-5">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-white">
            Memora<span className="text-accent">Mind</span>
          </Link>

          <div className="flex gap-2 text-sm">
            <Link className="rounded-xl px-3 py-2 text-slate-300 hover:bg-white/5" to="/onboarding">
              Setup
            </Link>
            <Link className="rounded-xl px-3 py-2 text-slate-300 hover:bg-white/5" to="/">
              Demo
            </Link>
          </div>
        </nav>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <RouteTransition>
                <LandingPage />
              </RouteTransition>
            }
          />
          <Route
            path="/onboarding"
            element={
              <RouteTransition>
                <OnboardingPage />
              </RouteTransition>
            }
          />
          <Route
            path="/companion/:elderId"
            element={
              <RouteTransition>
                <CompanionPage />
              </RouteTransition>
            }
          />
          <Route
            path="/dashboard/:elderId"
            element={
              <RouteTransition>
                <DashboardPage />
              </RouteTransition>
            }
          />
          <Route
            path="*"
            element={
              <RouteTransition>
                <NotFoundPage />
              </RouteTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
