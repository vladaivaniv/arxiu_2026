import { useState, useEffect, useRef } from "react";
import ScrollGlitchMedia from "./ScrollGlitchMedia.jsx";
import ShuffleText from "./ShuffleText.jsx";
import ScrollTypeText from "./ScrollTypeText.jsx";

const LINE_CHARS = ["─", "─", "─", "╌", "·", "─"];
const LINE_LEN = 90;

function AsciiLine() {
  const [line, setLine] = useState("─".repeat(LINE_LEN));
  const timerRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      setLine(Array.from({ length: LINE_LEN }, () =>
        LINE_CHARS[Math.floor(Math.random() * LINE_CHARS.length)]
      ).join(""));
      timerRef.current = setTimeout(tick, 600 + Math.random() * 400);
    };
    timerRef.current = setTimeout(tick, 600);
    return () => clearTimeout(timerRef.current);
  }, []);

  return <div className="wc-rule-ascii" aria-hidden="true">{line}</div>;
}

function ViewfinderOverlay({ current, total }) {
  return (
    <div className="vf-overlay" aria-hidden="true">
      <span className="vf-corner vf-tl" />
      <span className="vf-corner vf-tr" />
      <span className="vf-corner vf-br" />
      <span className="vf-num" style={{ top: "12%", left: "3%" }}>00</span>
      <span className="vf-num" style={{ top: "12%", right: "3%" }}>00</span>
      <span className="vf-num" style={{ bottom: "12%", left: "3%" }}>33</span>
      <span className="vf-num" style={{ bottom: "12%", right: "3%" }}>100</span>
      <span className="vf-counter">
        {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}

function GalleryStrip({ photos, mediaSrc, totalPhotos, active, onSelect }) {
  const items = photos.length > 0
    ? photos
    : Array.from({ length: totalPhotos }).map(() => null);

  return (
    <div className="wc-gallery-strip">
      {items.map((src, i) => (
        <button
          key={i}
          type="button"
          className={`wc-gallery-thumb${active === i ? " is-active" : ""}`}
          onClick={() => onSelect(i)}
          aria-label={`foto ${i + 1}`}
        >
          {src
            ? <img src={src} alt={`foto ${i + 1}`} />
            : <video src={mediaSrc} muted playsInline preload="metadata" />
          }
        </button>
      ))}
    </div>
  );
}

export default function ProjectCard({ work, index, total }) {
  const seqPadded = String(index + 1).padStart(3, "0");
  const photos = work.photos ?? [];
  const totalSlides = photos.length > 0 ? photos.length : 6;
  const [activeThumb, setActiveThumb] = useState(0);

  return (
    <article className="work-card horizontal-panel">

      {/* ── body ── */}
      <div className="wc-body">

        {/* LEFT */}
        <div className="wc-left">

          <div className="wc-index-line">
            <span className="wc-index-marker">▸</span>
            <ShuffleText as="span" className="wc-index-text"
              text={`PROJECTE_${seqPadded}`}
              delay={index * 90} duration={520} triggerOnView playOnce threshold={0.2}
            />
          </div>

          <div className="wc-title-block">
            <ShuffleText as="h3" text={work.title} className="wc-title"
              delay={index * 120 + 80} duration={920} interval={1800}
              triggerOnView playOnce={false} threshold={0.2}
            />
          </div>

          <AsciiLine />

          <div className="wc-authors-block">
            <ShuffleText as="span" className="wc-authors-label"
              text="> AUTORS"
              delay={index * 60 + 300} duration={400} triggerOnView playOnce threshold={0.2}
            />
            <div className="wc-authors-list">
              {(work.authors ?? []).map((a, i) => (
                <ShuffleText key={a} as="span" className="wc-author-name"
                  text={a}
                  delay={index * 60 + 380 + i * 60} duration={600} interval={2800}
                  triggerOnView playOnce={false} threshold={0.2}
                />
              ))}
            </div>
          </div>

          <div className="wc-authors-block">
            <ShuffleText as="span" className="wc-authors-label"
              text="> DESCRIPCIÓ"
              delay={index * 60 + 500} duration={400} triggerOnView playOnce threshold={0.2}
            />
            <ScrollTypeText as="p" text={work.description} className="wc-desc"
              delay={index * 120 + 300} speed={18} threshold={0.1}
            />
          </div>


        </div>

        {/* RIGHT */}
        <div className="wc-right">
          <div className="wc-media-frame">
            <ScrollGlitchMedia
              src={work.mediaSrc}
              objectPosition={work.objectPosition}
              title={work.title}
            />
            <ViewfinderOverlay current={activeThumb} total={totalSlides} />
          </div>

          <GalleryStrip
            photos={photos}
            mediaSrc={work.mediaSrc}
            totalPhotos={6}
            active={activeThumb}
            onSelect={setActiveThumb}
          />
        </div>

      </div>
    </article>
  );
}
