import { useState } from "react";
import ShuffleText from "./ShuffleText.jsx";

const FILTER_LABELS = {
  "ART I CULTURA DIGITAL": "ART I CULTURA DIGITAL",
  "LABORATORI DE CREACIONS ARTISTIQUES": "Laboratori de Creacions Artístiques",
};

export default function ProjectsChrome({
  activeFilter,
  filters,
  onFilterSelect,
  projectCount,
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (filter) => {
    onFilterSelect(filter);
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
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`works-filter-option${filter === activeFilter ? " is-active" : ""}`}
                onClick={() => handleSelect(filter)}
              >
                {FILTER_LABELS[filter] ?? filter}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
