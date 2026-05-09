import { useMemo, useRef, useState } from "react";
import { WORK_FILTERS, PROGRAM_SEPARATORS, workEntries } from "./data/workEntries.js";
import ArchiveIntroSection from "./components/ArchiveIntroSection.jsx";
import HeroSection from "./components/HeroSection.jsx";
import ProjectsChrome from "./components/ProjectsChrome.jsx";
import WorksSection from "./components/WorksSection.jsx";
import useHorizontalScroll from "./hooks/useHorizontalScroll.js";
import useNoiseLayer from "./hooks/useNoiseLayer.js";
import useLenis from "./hooks/useLenis.js";
import PixelSectionTransition from "./components/PixelSectionTransition.jsx";
import AsciiCursor from "./components/AsciiCursor.jsx";
import SiteTrailLine from "./components/SiteTrailLine.jsx";

export default function App() {
  const shellRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const noiseRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState(null);

  const visibleWorks = useMemo(() => {
    if (!activeFilter) {
      return workEntries;
    }

    return workEntries.filter((work) => work.program === activeFilter);
  }, [activeFilter]);

  const projectPages = useMemo(() => {
    const pages = [];
    let lastProgram = null;

    for (const work of visibleWorks) {
      if (work.program !== lastProgram) {
        const sep = PROGRAM_SEPARATORS[work.program];
        if (sep) {
          pages.push({
            id: `separator-${work.program}`,
            type: "separator",
            ...sep,
          });
        }
        lastProgram = work.program;
      }
      pages.push({ id: work.title, type: "project", work });
    }

    return pages;
  }, [visibleWorks]);

  const handleFilterSelect = (filter) => {
    setActiveFilter(filter);
  };

  useLenis();
  useNoiseLayer(noiseRef);
  useHorizontalScroll({ shellRef, viewportRef, trackRef });

  return (
    <main ref={shellRef} className="landing-shell">
      <AsciiCursor />
      <SiteTrailLine />
      <div ref={viewportRef} className="horizontal-viewport">
        <div ref={noiseRef} className="noise-layer" aria-hidden="true" />
        <div className="scanline-layer" aria-hidden="true" />

        <ProjectsChrome
          activeFilter={activeFilter}
          filters={WORK_FILTERS}
          onFilterSelect={handleFilterSelect}
          projectCount={visibleWorks.length}
        />

        <div ref={trackRef} className="horizontal-track">
          <HeroSection />
          <ArchiveIntroSection />
          <WorksSection pages={projectPages} projectCount={visibleWorks.length} />
        </div>
      </div>
    </main>
  );
}
