import { Fragment, useMemo, useRef, useState } from "react";
import { WORK_FILTERS, PROGRAM_SEPARATORS, workEntries } from "./data/workEntries.js";
import ArchiveIntroSection from "./components/ArchiveIntroSection.jsx";
import HeroSection from "./components/HeroSection.jsx";
import ProjectsChrome from "./components/ProjectsChrome.jsx";
import SectionDivider from "./components/SectionDivider.jsx";
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

  const projectGroups = useMemo(() => {
    const groups = [];
    let runningIndex = 0;

    for (const [program, separator] of Object.entries(PROGRAM_SEPARATORS)) {
      const works = visibleWorks.filter((work) => work.program === program);
      if (!works.length) continue;

      groups.push({
        id: `group-${program}`,
        program,
        separator,
        works,
        startIndex: runningIndex,
      });

      runningIndex += works.length;
    }

    return groups;
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
          {projectGroups.length === 0 ? (
            <WorksSection works={[]} projectCount={0} startIndex={0} />
          ) : (
            projectGroups.map((group) => (
              <Fragment key={group.id}>
                <SectionDivider
                  titleLines={group.separator.titleLines}
                  subtitle={group.separator.subtitle}
                />
                <WorksSection
                  works={group.works}
                  projectCount={visibleWorks.length}
                  startIndex={group.startIndex}
                />
              </Fragment>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
