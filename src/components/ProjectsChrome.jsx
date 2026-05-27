import { useState } from "react";
import ShuffleText from "./ShuffleText.jsx";

const FILTER_LABELS = {
  "ART I CULTURA DIGITAL": "PROJECTES TREPAT",
  "LABORATORI DE CREACIONS ARTISTIQUES": "PROJECTES D'ART DIGITAL",
};

export default function ProjectsChrome({
  activeFilter,
  filters,
  onFilterSelect,
  projectCount,
  works = [],
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const scrollToTrackTarget = (el) => {
    const track = document.querySelector(".horizontal-track");
    if (!el || !track) return;
    const elRect = el.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const targetY = Math.max(0, elRect.left - trackRect.left);
    const lenis = window.__lenis;
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(targetY, { duration: 1.4 });
    } else {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  };

  const handleSelectGroup = (filter) => {
    const el = document.querySelector(`.section-divider[data-program="${CSS.escape(filter)}"]`);
    scrollToTrackTarget(el);
    setOpen(false);
  };

  const handleSelectProject = (title) => {
    const el = document.querySelector(`[data-work-title="${CSS.escape(title)}"]`);
    scrollToTrackTarget(el);
    setOpen(false);
  };

  return (
    <div className="projects-chrome">

      <header className="works-header">
        <ShuffleText
          as="h2"
          id="works-title"
          text="[ PROJECTES ]"
          className="works-title"
          delay={30}
          interval={4200}
          duration={920}
        />
      </header>

      <div className="works-filter-bar">
        <button
          type="button"
          className={`works-filter-toggle${open ? " is-open" : ""}${activeFilter ? " has-active" : ""}`}
          onClick={() => setOpen((v) => !v)}
        >
          <span>FILTRE</span>
          <span className="works-filter-arrow" aria-hidden="true">{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <div className="works-filter-dropdown">
            {filters.map((filter) => {
              const projectsInGroup = works.filter((w) => w.program === filter);
              const isExpanded = expanded === filter;
              return (
                <div key={filter} className="works-filter-group">
                  <div className="works-filter-group-row">
                    <button
                      type="button"
                      className={`works-filter-option${filter === activeFilter ? " is-active" : ""}`}
                      onClick={() => handleSelectGroup(filter)}
                    >
                      {FILTER_LABELS[filter] ?? filter}
                    </button>
                    <button
                      type="button"
                      className="works-filter-expand"
                      onClick={() => setExpanded(isExpanded ? null : filter)}
                      aria-label="Mostra projectes"
                    >
                      {isExpanded ? "−" : "+"}
                    </button>
                  </div>
                  {isExpanded && (
                    <ul className="works-filter-projects">
                      {projectsInGroup.map((w) => (
                        <li key={w.title}>
                          <button
                            type="button"
                            className="works-filter-project"
                            onClick={() => handleSelectProject(w.title)}
                          >
                            {w.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
