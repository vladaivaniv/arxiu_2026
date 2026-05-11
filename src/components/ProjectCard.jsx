import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollGlitchMedia from "./ScrollGlitchMedia.jsx";
import ShuffleText from "./ShuffleText.jsx";
import ScrollTypeText from "./ScrollTypeText.jsx";
import CardGlyphBg from "./CardGlyphBg.jsx";
import SaltFall from "./SaltFall.jsx";
import SeaWaves from "./SeaWaves.jsx";
import DartThrow from "./DartThrow.jsx";
import PowerDialog from "./PowerDialog.jsx";
import EmotionLight from "./EmotionLight.jsx";
import Panoptic from "./Panoptic.jsx";
import ToySoldiers from "./ToySoldiers.jsx";
import DataExtract from "./DataExtract.jsx";
import ScrapGold from "./ScrapGold.jsx";

gsap.registerPlugin(ScrollTrigger);

const LINE_CHARS = ["─", "─", "─", "╌", "·", "─"];
const LINE_LEN = 90;
const COLUMN_REVEAL_WINDOW = 1.18;
const INDEX_REVEAL_OFFSET = 0.04;
const INDEX_REVEAL_WINDOW = 0.82;
const TITLE_REVEAL_OFFSET = 0.08;
const TITLE_REVEAL_WINDOW = 0.9;
const RULE_REVEAL_OFFSET = 0.12;
const RULE_REVEAL_WINDOW = 0.86;
const AUTHORS_REVEAL_OFFSET = 0.18;
const AUTHORS_REVEAL_WINDOW = 0.88;
const DESCRIPTION_REVEAL_OFFSET = 0.24;
const DESCRIPTION_REVEAL_WINDOW = 0.9;
const MEDIA_REVEAL_OFFSET = 0.1;
const MEDIA_REVEAL_WINDOW = 0.96;
const GALLERY_REVEAL_OFFSET = 0.18;
const GALLERY_REVEAL_WINDOW = 0.92;

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
    </div>
  );
}

function GalleryStrip({ items, totalPhotos, active, onSelect }) {
  const galleryItems = items.length > 0
    ? items
    : Array.from({ length: totalPhotos }).map(() => null);

  return (
    <div className="wc-gallery-strip">
      {galleryItems.map((item, i) => (
        <button
          key={i}
          type="button"
          className={`wc-gallery-thumb${active === i ? " is-active" : ""}`}
          onClick={() => onSelect(i)}
          aria-label={`${item?.type === "video" ? "video" : "foto"} ${i + 1}`}
        >
          {item?.type === "image" ? (
            <img src={item.src} alt={`foto ${i + 1}`} loading="lazy" decoding="async" />
          ) : null}
          {item?.type === "video" ? (
            <>
              <video src={item.src} muted playsInline preload="none" />
              <span className="wc-gallery-type">VIDEO</span>
            </>
          ) : null}
          {!item ? <span className="wc-gallery-placeholder" aria-hidden="true" /> : null}
        </button>
      ))}
    </div>
  );
}

function LargePhotoMedia({ src, title, objectPosition }) {
  return (
    <div className="work-media work-photo-media">
      <img
        key={src}
        className="work-preview work-photo-preview"
        src={src}
        alt={title}
        decoding="async"
        style={{ objectPosition }}
      />
      <div className="work-glitch-noise is-photo-layer" aria-hidden="true" />
      <div className="work-glitch-scan is-photo-layer" aria-hidden="true" />
    </div>
  );
}

export default function ProjectCard({ work, index, total }) {
  const cardRef = useRef(null);
  const textColumnRef = useRef(null);
  const mediaColumnRef = useRef(null);
  const mediaFrameRef = useRef(null);
  const galleryRef = useRef(null);
  const indexLineRef = useRef(null);
  const titleBlockRef = useRef(null);
  const ruleRef = useRef(null);
  const authorsBlockRef = useRef(null);
  const descriptionBlockRef = useRef(null);
  const seqPadded = String(index + 1).padStart(3, "0");
  const mediaItems = work.mediaItems ?? [];
  const totalSlides = mediaItems.length > 0 ? mediaItems.length : 6;
  const [activeThumb, setActiveThumb] = useState(0);
  const selectedItem = mediaItems[activeThumb] ?? (
    work.mediaSrc ? { type: "video", src: work.mediaSrc } : null
  );

  useEffect(() => {
    setActiveThumb(0);
  }, [work.title]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;

    const track = card.closest(".horizontal-track");
    if (!track) return undefined;

    const clamp01 = (value) => Math.max(0, Math.min(1, value));
    const smoothstep = (value) => {
      const t = clamp01(value);
      return t * t * (3 - 2 * t);
    };

    const setTextReveal = (node, {
      progress,
      blur = 0,
      x = 0,
      y = 0,
      opacity = progress,
    }) => {
      if (!node) return;

      gsap.set(node, {
        opacity,
        filter: blur > 0 ? `blur(${((1 - progress) * blur).toFixed(2)}px)` : "none",
        x,
        y,
      });
    };

    const textColumn = textColumnRef.current;
    const mediaColumn = mediaColumnRef.current;
    const mediaFrame = mediaFrameRef.current;
    const gallery = galleryRef.current;
    const indexLine = indexLineRef.current;
    const titleBlock = titleBlockRef.current;
    const rule = ruleRef.current;
    const authorsBlock = authorsBlockRef.current;
    const descriptionBlock = descriptionBlockRef.current;

    [
      textColumn,
      mediaColumn,
      mediaFrame,
      gallery,
      indexLine,
      titleBlock,
      rule,
      authorsBlock,
      descriptionBlock,
    ].forEach((node) => {
      if (!node) return;
      gsap.set(node, { opacity: 0, x: 0, y: 0, filter: "blur(0px)" });
    });

    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: () => `+=${Math.max(0, track.scrollWidth - window.innerWidth)}`,
      scrub: true,
      onUpdate: (self) => {
        const totalDistance = track.scrollWidth - window.innerWidth;
        if (totalDistance <= 0) return;

        const scrollX = totalDistance * self.progress;
        const cardLeft = card.offsetLeft;
        const viewportWidth = window.innerWidth;
        const localProgress = clamp01(
          (scrollX - (cardLeft - viewportWidth * 0.85)) / (viewportWidth * 0.85),
        );

        const columnProgress = smoothstep(localProgress / COLUMN_REVEAL_WINDOW);
        setTextReveal(textColumn, {
          progress: columnProgress,
          blur: 0,
          x: (1 - columnProgress) * 220,
        });

        const mediaColumnProgress = smoothstep(
          (localProgress - MEDIA_REVEAL_OFFSET) / MEDIA_REVEAL_WINDOW,
        );
        setTextReveal(mediaColumn, {
          progress: mediaColumnProgress,
          blur: 0,
          x: (1 - mediaColumnProgress) * 160,
        });

        const mediaFrameProgress = smoothstep(
          (localProgress - MEDIA_REVEAL_OFFSET) / MEDIA_REVEAL_WINDOW,
        );
        setTextReveal(mediaFrame, {
          progress: mediaFrameProgress,
          blur: 0,
          x: (1 - mediaFrameProgress) * 220,
          y: (1 - mediaFrameProgress) * 24,
        });

        const galleryProgress = smoothstep(
          (localProgress - GALLERY_REVEAL_OFFSET) / GALLERY_REVEAL_WINDOW,
        );
        setTextReveal(gallery, {
          progress: galleryProgress,
          blur: 0,
          x: (1 - galleryProgress) * 180,
          y: (1 - galleryProgress) * 18,
        });

        const indexProgress = smoothstep(
          (localProgress - INDEX_REVEAL_OFFSET) / INDEX_REVEAL_WINDOW,
        );
        setTextReveal(indexLine, {
          progress: indexProgress,
          blur: 0,
          x: (1 - indexProgress) * 180,
        });

        const titleProgress = smoothstep(
          (localProgress - TITLE_REVEAL_OFFSET) / TITLE_REVEAL_WINDOW,
        );
        setTextReveal(titleBlock, {
          progress: titleProgress,
          blur: 0,
          x: (1 - titleProgress) * 360,
          y: (1 - titleProgress) * 40,
        });

        const ruleProgress = smoothstep(
          (localProgress - RULE_REVEAL_OFFSET) / RULE_REVEAL_WINDOW,
        );
        setTextReveal(rule, {
          progress: ruleProgress,
          blur: 0,
          x: (1 - ruleProgress) * 160,
        });

        const authorsProgress = smoothstep(
          (localProgress - AUTHORS_REVEAL_OFFSET) / AUTHORS_REVEAL_WINDOW,
        );
        setTextReveal(authorsBlock, {
          progress: authorsProgress,
          blur: 0,
          x: (1 - authorsProgress) * 220,
          y: (1 - authorsProgress) * 20,
        });

        const descriptionProgress = smoothstep(
          (localProgress - DESCRIPTION_REVEAL_OFFSET) / DESCRIPTION_REVEAL_WINDOW,
        );
        setTextReveal(descriptionBlock, {
          progress: descriptionProgress,
          blur: 0,
          x: 0,
          y: 0,
        });
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <article ref={cardRef} className="work-card horizontal-panel">

      <CardGlyphBg />

      {index === 0 ? <SaltFall /> : null}
      {index === 1 ? <SeaWaves /> : null}
      {index === 3 ? <DartThrow /> : null}
      {index === 4 ? <PowerDialog /> : null}
      {index === 5 ? <EmotionLight /> : null}
      {index === 6 ? <ScrapGold /> : null}
      {index === 7 ? <Panoptic /> : null}
      {index === 8 ? <ToySoldiers /> : null}
      {index === 9 ? <DataExtract /> : null}

      {/* ── body ── */}
      <div className="wc-body">

        {/* LEFT */}
        <div ref={textColumnRef} className="wc-left">

          <div ref={indexLineRef} className="wc-index-line">
            <span className="wc-index-marker">▸</span>
            <ShuffleText as="span" className="wc-index-text"
              text={`PROJECTE_${seqPadded}`}
              delay={index * 90} duration={520} triggerOnView playOnce threshold={0.2}
            />
          </div>

          <div ref={titleBlockRef} className="wc-title-block">
            <ShuffleText as="h3" text={work.title} className="wc-title"
              delay={index * 120 + 80} duration={920} interval={1800}
              triggerOnView playOnce={false} threshold={0.2}
              initialTextVisible
            />
          </div>

          <div ref={ruleRef}>
            <AsciiLine />
          </div>

          <div ref={authorsBlockRef} className="wc-authors-block">
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

          <div ref={descriptionBlockRef} className="wc-authors-block">
            <ShuffleText as="span" className="wc-authors-label"
              text="> DESCRIPCIÓ"
              delay={index * 60 + 500} duration={400} triggerOnView playOnce threshold={0.2}
            />
            <p className="wc-desc">{work.description}</p>
          </div>


        </div>

        {/* RIGHT */}
        <div ref={mediaColumnRef} className="wc-right">
          <div ref={mediaFrameRef} className="wc-media-frame">
            {selectedItem?.type === "image" ? (
              <LargePhotoMedia
                src={selectedItem.src}
                objectPosition={work.objectPosition}
                title={work.title}
              />
            ) : (
              <ScrollGlitchMedia
                src={selectedItem?.src ?? work.mediaSrc}
                objectPosition={work.objectPosition}
                title={work.title}
              />
            )}
            <ViewfinderOverlay current={activeThumb} total={totalSlides} />
          </div>

          <div ref={galleryRef}>
            <GalleryStrip
              items={mediaItems}
              totalPhotos={totalSlides}
              active={activeThumb}
              onSelect={setActiveThumb}
            />
          </div>
        </div>

      </div>
    </article>
  );
}
