import ShuffleText from "./ShuffleText.jsx";

function formatProjectCount(count) {
  return `${count.toString().padStart(2, "0")} PROJECTES`;
}

export default function ProjectsChrome({
  activeFilter,
  filters,
  filtersOpen,
  onFilterSelect,
  onToggleFilters,
  projectCount,
}) {
  return (
    <div className="projects-chrome">
      <header className="works-header">
        <ShuffleText
          as="h2"
          id="works-title"
          text="[PROJECTES"
          className="works-title"
          delay={180}
          interval={4200}
          duration={920}
        />
      </header>

      <div className="works-toolbar-layer">
        <div className={`works-toolbar${filtersOpen ? " is-open" : ""}`}>
          <button
            type="button"
            className="works-toolbar-main"
            onClick={onToggleFilters}
            aria-expanded={filtersOpen}
            aria-controls="works-filters"
          >
            <span>FILTRE</span>
            <span className="works-toolbar-plus" aria-hidden="true">
              +
            </span>
          </button>

          <div className="works-toolbar-summary">
            <span>:FILTRES</span>
            <span>{formatProjectCount(projectCount)}</span>
          </div>

          {filtersOpen ? (
            <div id="works-filters" className="works-filter-list">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`works-filter-chip${
                    filter === activeFilter ? " is-active" : ""
                  }`}
                  onClick={() => onFilterSelect(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
