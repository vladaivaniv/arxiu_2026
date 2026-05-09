import ProjectCard from "./ProjectCard.jsx";

export default function WorksSection({ works, projectCount, startIndex = 0 }) {
  let projectIndex = startIndex;

  return (
    <section className="works-section horizontal-panel" aria-labelledby="works-title">
      <div className="works-pin">
        <div className="works-shell">
          <div className="works-list">
            {works.map((work) => {
              const currentProjectIndex = projectIndex;
              projectIndex += 1;

              return (
                <ProjectCard
                  key={work.title}
                  work={work}
                  index={currentProjectIndex}
                  total={projectCount}
                />
              );
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
