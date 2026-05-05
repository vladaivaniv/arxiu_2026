import ShuffleText from "./ShuffleText.jsx";

export default function ProjectInfoPage({ page }) {
  return (
    <article className="project-info-page horizontal-panel">
      <div className="project-info-body" aria-label={page.title}>
        {page.body.map((line, index) => (
          <ShuffleText
            key={line}
            text={line}
            delay={index * 170}
            duration={780}
            interval={3400 + index * 180}
            triggerOnView
            playOnce
            aria-label={line}
          />
        ))}
      </div>
    </article>
  );
}
