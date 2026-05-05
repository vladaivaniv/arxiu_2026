import ProjectCard from "./ProjectCard.jsx";
import ProjectInfoPage from "./ProjectInfoPage.jsx";

function renderProjectPage(page, projectIndex) {
  if (page.type === "info") {
    return <ProjectInfoPage key={page.id} page={page} />;
  }

  if (page.type === "project") {
    return (
      <ProjectCard
        key={page.id}
        work={page.work}
        index={projectIndex}
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

              if (page.type === "project") {
                projectIndex += 1;
              }

              return renderProjectPage(page, currentProjectIndex);
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
