import ScrollTypeText from "./ScrollTypeText.jsx";

export default function ProjectInfoPage({ page }) {
  return (
    <article className="project-info-page horizontal-panel">
      <div className="project-info-copy">
        <span className="project-info-kicker">{page.kicker}</span>

        <ScrollTypeText
          as="h3"
          text={page.title}
          className="project-info-title"
          delay={120}
          speed={30}
        />

        <div className="project-info-body">
          {page.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      {page.stats?.length ? (
        <dl className="project-info-stats">
          {page.stats.map((stat) => (
            <div key={stat.label} className="project-info-stat">
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}
