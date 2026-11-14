import { useEffect } from "react";
import {
  Compass,
  NotebookPen,
  Settings2,
  Sparkles,
} from "lucide-react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { usePreferences } from "../stores/preferences";
import {
  Landing,
  MissionSelection,
  Onboarding,
  Briefing,
  Equipment,
} from "../features/preparation";
import { Control, Decisions, Exploration } from "../features/mission";
import { Journal, Results, Science, Settings } from "../features/learning";

export function App() {
  const { pathname } = useLocation();
  const reducedMotion = usePreferences((s) => s.reducedMotion);
  const largeText = usePreferences((s) => s.largeText);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
    document.documentElement.dataset.largeText = String(largeText);
  }, [reducedMotion, largeText]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div
      className={`app-shell ${pathname === "/explore" ? "in-mission" : ""} ${pathname === "/" ? "at-launchpad" : ""}`}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              <span>✦</span>
            </span>
            <span>
              ASTRA <small>Junior Mission Commander</small>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            <NavLink
              to="/missions"
              aria-label="Missions"
              className={({ isActive }) =>
                isActive ||
                [
                  "/onboarding",
                  "/briefing",
                  "/equipment",
                  "/explore",
                  "/decisions",
                ].includes(pathname)
                  ? "nav-active"
                  : ""
              }
            >
              <Compass size={16} />
              <span>Missions</span>
            </NavLink>
            <NavLink to="/science" aria-label="Science explorer">
              <Sparkles size={16} />
              <span className="nav-desktop-label">Science explorer</span>
              <span className="nav-mobile-label">Science</span>
            </NavLink>
            <NavLink to="/journal" aria-label="Mission journal">
              <NotebookPen size={16} />
              <span className="nav-desktop-label">Mission journal</span>
              <span className="nav-mobile-label">Journal</span>
            </NavLink>
          </nav>
          <div className="header-end">
            <span className="program-tag">
              <span className="signal-dot" /> Adventure is out there
            </span>
            <NavLink
              to="/settings"
              className="icon-button"
              aria-label="Settings and accessibility"
            >
              <Settings2 size={20} />
              <span className="nav-mobile-label">Settings</span>
            </NavLink>
          </div>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        data-view={pathname.slice(1) || "home"}
        className={
          pathname === "/"
            ? "landing-main"
            : `content-main ${pathname === "/explore" ? "game-main" : ""}`
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/missions" element={<MissionSelection />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/briefing" element={<Briefing />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/control" element={<Control />} />
          <Route path="/explore" element={<Exploration />} />
          <Route path="/decisions" element={<Decisions />} />
          <Route path="/science" element={<Science />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/results" element={<Results />} />
          <Route path="/report" element={<Journal reportOnly />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="*"
            element={
              <div className="state-panel">
                <h1>A little off course.</h1>
                <p>Let's get you back to mission control.</p>
                <Link className="button" to="/">
                  Return home
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
