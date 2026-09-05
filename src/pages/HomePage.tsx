import { lazy, Suspense } from "react";

// Section-based code splitting to defer loading heavy section components until they are actually rendered,
// which further reduces the initial load size.
const Header = lazy(() => import("@/components/content/Header/Header"));
const About = lazy(() => import("@/components/content/About/About"));
const Projects = lazy(() => import("@/components/content/Projects/Projects"));
const Work = lazy(() => import("@/components/content/Work/Work"));

export function HomePage() {
  return (
    <Suspense fallback={null}>
      <div>
        <Header />
        <About />
        <Projects />
        <Work />
      </div>
    </Suspense>
  );
}
