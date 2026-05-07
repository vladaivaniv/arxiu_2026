import ShuffleText from "./ShuffleText.jsx";
import AsciiScatter from "./AsciiScatter.jsx";

export default function SectionDivider({ titleLines, subtitle }) {
  return (
    <div className="section-divider horizontal-panel">
      <div className="section-divider-bg" aria-hidden="true" />
      <AsciiScatter fullSpread count={60} maxOpacity={0.28} />

      <div className="section-divider-inner">

        <div className="section-divider-titles">
          {titleLines.map((line, i) => (
            <ShuffleText
              key={line}
              as="h2"
              className={`section-divider-title${i === 0 ? " is-first" : ""}`}
              text={line}
              delay={i * 160}
              duration={820}
              interval={4800 + i * 600}
            />
          ))}
        </div>

        <div className="section-divider-line" aria-hidden="true" />

        <div className="section-divider-subtitle-wrap">
          <ShuffleText
            as="p"
            className="section-divider-subtitle"
            text={subtitle}
            delay={300}
            duration={600}
            interval={3800}
          />
        </div>
      </div>

      <div className="section-divider-corner section-divider-corner--br" aria-hidden="true">
        <span>2025–2026</span>
      </div>
    </div>
  );
}
