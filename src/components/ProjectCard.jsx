import ScrollGlitchMedia from "./ScrollGlitchMedia.jsx";
import ScrollTypeText from "./ScrollTypeText.jsx";
import ShuffleText from "./ShuffleText.jsx";

const ASCII_BARS = ["████░░░░░░", "██████░░░░", "███░░░░░░░", "█████████░", "███████░░░"];

export default function ProjectCard({ work, index }) {
  const seqPadded = String(index + 1).padStart(3, "0");
  const bar = ASCII_BARS[index % ASCII_BARS.length];

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

        <p className="work-description">
          <span className="work-desc-prefix" aria-hidden="true">/*</span>
          {" "}{work.description}{" "}
          <span className="work-desc-prefix" aria-hidden="true">*/</span>
        </p>

        <div className="work-meta">
          <ShuffleText
            text={`:: ${work.client} / ${work.year}`}
            as="p"
            className="work-meta-text"
            delay={index * 90}
            duration={720}
            triggerOnView
            playOnce
            threshold={0.35}
          />
          <ShuffleText
            text={`:: ${work.category}`}
            as="p"
            className="work-meta-text"
            delay={index * 90 + 80}
            duration={720}
            triggerOnView
            playOnce
            threshold={0.35}
          />
        </div>

        <div className="work-ascii-bar" aria-hidden="true">
          <span className="work-ascii-bar-fill">{bar}</span>
          <span className="work-ascii-bar-label">{`${(index + 1) * 10 + 30}%`}</span>
        </div>

        <div className="work-ascii-footer" aria-hidden="true">
          <ShuffleText
            as="span"
            className="work-ascii-footer-line"
            text={`PROG.${work.program.split(" ").map(w => w[0]).join("")} / IDX_${seqPadded} / ${work.year}`}
            delay={index * 100 + 300}
            duration={600}
            interval={5000}
          />
        </div>

      </div>

      <div className="work-media-wrap">
        <div className="work-media-ascii-top" aria-hidden="true">
          <span>{`+--[ ${work.title} ]`}</span>
          <span>{"--+"}</span>
        </div>
        <ScrollGlitchMedia
          src={work.mediaSrc}
          objectPosition={work.objectPosition}
          title={work.title}
        />
        <div className="work-media-ascii-bottom" aria-hidden="true">
          <ShuffleText
            as="span"
            text={`>> SRC:${work.mediaSrc ? "LOADED" : "NULL"} / FORMAT:MOV / RES:HD`}
            delay={index * 100 + 400}
            duration={500}
            interval={6000}
          />
        </div>
      </div>

    </article>
  );
}
