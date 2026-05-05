import { useMemo, useRef, useState } from "react";
import { WORK_FILTERS, workEntries } from "./data/workEntries.js";
import HeroSection from "./components/HeroSection.jsx";
import ProjectsChrome from "./components/ProjectsChrome.jsx";
import WorksSection from "./components/WorksSection.jsx";
import useHorizontalScroll from "./hooks/useHorizontalScroll.js";
import useNoiseLayer from "./hooks/useNoiseLayer.js";

export default function App() {
  const shellRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const noiseRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visibleWorks = useMemo(() => {
    if (!activeFilter) {
      return workEntries;
    }

    return workEntries.filter((work) => work.program === activeFilter);
  }, [activeFilter]);

  const projectPages = useMemo(
    () => [
      {
        id: "projectes-explanation",
        type: "info",
        kicker: "00 / CONTEXT",
        title: "COM LLEGIR L'ARXIU",
        body: [
          "Cada pagina funciona com una entrada independent dins la seccio de projectes.",
          "Pots afegir pagines explicatives, credits, processos o projectes nous canviant aquesta llista.",
        ],
        stats: [
          { label: "CURSOS", value: "02" },
          { label: "FORMATS", value: "VIDEO / TEXT / ARXIU" },
          { label: "PROJECTES", value: visibleWorks.length.toString().padStart(2, "0") },
        ],
      },
      ...visibleWorks.map((work) => ({
        id: work.title,
        type: "project",
        work,
      })),
    ],
    [visibleWorks],
  );

  const handleFilterSelect = (filter) => {
    setActiveFilter((currentFilter) =>
      currentFilter === filter ? null : filter,
    );
    setFiltersOpen(false);
  };

  useNoiseLayer(noiseRef);
  useHorizontalScroll({ shellRef, viewportRef, trackRef });

  return (
    <main ref={shellRef} className="landing-shell">
      <div ref={viewportRef} className="horizontal-viewport">
        <div ref={noiseRef} className="noise-layer" aria-hidden="true" />
        <div className="scanline-layer" aria-hidden="true" />

        <ProjectsChrome
          activeFilter={activeFilter}
          filters={WORK_FILTERS}
          filtersOpen={filtersOpen}
          onFilterSelect={handleFilterSelect}
          onToggleFilters={() => setFiltersOpen((current) => !current)}
          projectCount={visibleWorks.length}
        />

        <div ref={trackRef} className="horizontal-track">
          <HeroSection />
          <WorksSection pages={projectPages} projectCount={visibleWorks.length} />
        </div>
      </div>
    </main>
  );
}
