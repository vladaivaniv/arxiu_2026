import { Fragment, useMemo, useState } from "react";
import ScrollTypeText from "./ScrollTypeText.jsx";

const FILTERS = ["ALL WORKS", "COMMERCIAL", "INSTALLATION", "EDITORIAL"];

function formatProjectCount(count) {
  return `${count.toString().padStart(2, "0")} PROJECTS`;
}

export default function WorksSection({ works }) {
  const [activeFilter, setActiveFilter] = useState("ALL WORKS");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visibleWorks = useMemo(() => {
    if (activeFilter === "ALL WORKS") {
      return works;
    }

    return works.filter((work) => work.category === activeFilter);
  }, [activeFilter, works]);

  const handleFilterSelect = (filter) => {
    setActiveFilter(filter);
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
            <span>{activeFilter}</span>
            <span className="works-toolbar-plus" aria-hidden="true">
              +
            </span>
          </button>

          <div className="works-toolbar-summary">
            <span>:FILTERS</span>
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

      <div className="works-shell">
        <header className="works-header">
          <ScrollTypeText
            as="h2"
            id="works-title"
            text="Projectes"
            className="works-title"
            speed={42}
            threshold={0.2}
          />
        </header>

        <div className="works-list">
          {visibleWorks.map((work, index) => (
            <Fragment key={work.title}>
              <article className={`work-card${index === 0 ? " is-featured" : ""}`}>
                <div className="work-meta">
                  <ScrollTypeText
                    text={`${work.client} • ${work.year}`}
                    className="work-meta-text"
                    delay={index * 90}
                    speed={22}
                  />
                  <ScrollTypeText
                    text={work.category}
                    className="work-meta-text"
                    delay={index * 90 + 80}
                    speed={22}
                  />
                </div>

                <div className="work-media">
                  <video
                    className="work-preview"
                    src={work.mediaSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    style={{ objectPosition: work.objectPosition }}
                  />
                </div>

                <ScrollTypeText
                  as="h3"
                  text={work.title}
                  className="work-title-text"
                  delay={index * 120 + 120}
                  speed={34}
                />
              </article>
            </Fragment>
          ))}

          {visibleWorks.length === 0 ? (
            <div className="works-empty">
              <p>No projects match this filter.</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
