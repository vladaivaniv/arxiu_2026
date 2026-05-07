import ScrollGlitchMedia from "./ScrollGlitchMedia.jsx";
import ScrollTypeText from "./ScrollTypeText.jsx";
import ShuffleText from "./ShuffleText.jsx";

export default function ProjectCard({ work, index }) {
  const seqPadded = String(index + 1).padStart(3, "0");
  const progAcronym = work.program.split(" ").map(w => w[0]).join("");

  return (
    <article className="work-card horizontal-panel">
      <div className="work-copy">

        <div className="work-terminal-header">
          <ShuffleText
            as="span"
            className="work-terminal-id"
            text={`// PROJECT_${seqPadded}`}
            delay={index * 90}
            duration={520}
            triggerOnView
            playOnce
            threshold={0.3}
          />
          <ShuffleText
            as="span"
            className="work-terminal-status"
            text="[ ONLINE ]"
            delay={index * 90 + 160}
            duration={420}
            triggerOnView
            playOnce
            threshold={0.3}
          />
        </div>

        <div className="work-title-block">
          <span className="work-title-prompt" aria-hidden="true">&gt;&gt;</span>
          <ScrollTypeText
            as="h3"
            text={work.title}
            className="work-title-text"
            delay={index * 120 + 120}
            speed={34}
          />
        </div>

        <div className="work-authors">
          <span className="work-authors-label" aria-hidden="true">[ AUTORS ]</span>
          <div className="work-authors-list">
            {work.authors.map((author, i) => (
              <ShuffleText
                key={author}
                as="span"
                className="work-author-name"
                text={`@${author}`}
                delay={index * 90 + i * 100 + 200}
                duration={580}
                interval={4200 + i * 300}
                triggerOnView
                playOnce
                threshold={0.3}
              />
            ))}
          </div>
        </div>

        <p className="work-description">
          <span className="work-desc-prefix" aria-hidden="true">/*</span>
          {" "}{work.description}{" "}
          <span className="work-desc-prefix" aria-hidden="true">*/</span>
        </p>

        <div className="work-ascii-footer" aria-hidden="true">
          <ShuffleText
            as="span"
            className="work-ascii-footer-line"
            text={`PROG.${progAcronym} / IDX_${seqPadded} / ${work.year}`}
            delay={index * 100 + 300}
            duration={600}
            interval={5000}
          />
        </div>

      </div>

      <div className="work-media-wrap">
        <ScrollGlitchMedia
          src={work.mediaSrc}
          objectPosition={work.objectPosition}
          title={work.title}
        />
      </div>

    </article>
  );
}
