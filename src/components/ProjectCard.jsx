import ScrollGlitchMedia from "./ScrollGlitchMedia.jsx";
import ScrollTypeText from "./ScrollTypeText.jsx";
import ShuffleText from "./ShuffleText.jsx";

export default function ProjectCard({ work, index }) {
  return (
    <article className="work-card horizontal-panel">
      <div className="work-copy">
        <span className="work-seq">{String(index + 1).padStart(2, "0")}</span>

        <ScrollTypeText
          as="h3"
          text={work.title}
          className="work-title-text"
          delay={index * 120 + 120}
          speed={34}
        />

        <p className="work-description">{work.description}</p>

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
  );
}
