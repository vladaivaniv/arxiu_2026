import { useMemo, useState } from "react";
import ScrollGlitchMedia from "./ScrollGlitchMedia.jsx";
import ShuffleText from "./ShuffleText.jsx";
import ScrollTypeText from "./ScrollTypeText.jsx";

const FILTERS = [
  "ART I CULTURA DIGITAL",
  "LABORATORI DE CREACIONS ARTISTIQUES",
];

function formatProjectCount(count) {
  return `${count.toString().padStart(2, "0")} PROJECTES`;
}

export default function WorksSection({ works }) {
  const [activeFilter, setActiveFilter] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visibleWorks = useMemo(() => {
    if (!activeFilter) {
      return works;
    }

    return works.filter((work) => work.program === activeFilter);
  }, [activeFilter, works]);

  const handleFilterSelect = (filter) => {
    setActiveFilter((currentFilter) =>
      currentFilter === filter ? null : filter,
    );
    setFiltersOpen(false);
  };

  return (
    <section className="works-section" aria-labelledby="works-title">
      <div className="works-toolbar-layer">
        <div className={`works-toolbar${filtersOpen ? " is-open" : ""}`}>
          <button
            type="button"
            className="works-toolbar-main"
            onClick={() => setFiltersOpen((current) => !current)}
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
            <span>{formatProjectCount(visibleWorks.length)}</span>
          </div>

          {filtersOpen ? (
            <div id="works-filters" className="works-filter-list">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`works-filter-chip${
                    filter === activeFilter ? " is-active" : ""
                  }`}
                  onClick={() => handleFilterSelect(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <header className="works-header">
        <ShuffleText
          as="h2"
          id="works-title"
          text="PROJECTES"
          className="works-title"
          delay={180}
          interval={4200}
          duration={920}
        />
      </header>

      <div className="works-shell">
        <div className="works-list">
          {visibleWorks.map((work, index) => (
            <article
              key={work.title}
              className={`work-card${index % 2 === 1 ? " is-reversed" : ""}`}
            >
              <div className="work-copy">
                <span className="work-seq">{String(index + 1).padStart(2, "0")}</span>

                <ScrollTypeText
                  as="h3"
                  text={work.title}
                  className="work-title-text"
                  delay={index * 120 + 120}
                  speed={34}
                />

                <div className="work-meta">
                  <ShuffleText
                    text={`${work.client} / ${work.year}`}
                    as="p"
                    className="work-meta-text"
                    delay={index * 90}
                    duration={720}
                    triggerOnView
                    playOnce
                    threshold={0.35}
                  />
                  <ShuffleText
                    text={work.category}
                    as="p"
                    className="work-meta-text"
                    delay={index * 90 + 80}
                    duration={720}
                    triggerOnView
                    playOnce
                    threshold={0.35}
                  />
                </div>
              </div>

              <ScrollGlitchMedia
                src={work.mediaSrc}
                objectPosition={work.objectPosition}
                title={work.title}
              />
            </article>
          ))}

          {visibleWorks.length === 0 ? (
            <div className="works-empty">
              <p>No hi ha projectes per a aquest filtre.</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
