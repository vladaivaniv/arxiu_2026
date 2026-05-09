import ProjectCard from "./ProjectCard.jsx";
import SectionDivider from "./SectionDivider.jsx";

function renderProjectPage(page, projectIndex, projectCount) {
  if (page.type === "project") {
    return (
      <ProjectCard
        key={page.id}
        work={page.work}
        index={projectIndex}
        total={projectCount}
      />
    );
  }

  if (page.type === "separator") {
    return (
      <SectionDivider
        key={page.id}
        titleLines={page.titleLines}
        subtitle={page.subtitle}
      />
    );
  }

  return null;
}

export default function WorksSection({ pages, projectCount }) {
  let projectIndex = 0;

  return (
    <section className="works-section horizontal-panel" aria-labelledby="works-title">
      <div className="works-pin">
        <div className="works-shell">
          <div className="works-list">
            {pages.map((page) => {
              const currentProjectIndex = projectIndex;
              if (page.type === "project") projectIndex += 1;
              return renderProjectPage(page, currentProjectIndex, projectCount);
            })}

            {projectCount === 0 ? (
              <div className="works-empty">
                <p>No hi ha projectes per a aquest filtre.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
