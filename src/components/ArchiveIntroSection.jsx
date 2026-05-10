import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AsciiBackground from "./AsciiBackground.jsx";
import ShuffleText from "./ShuffleText.jsx";
import TypeLine from "./TypeLine.jsx";

gsap.registerPlugin(ScrollTrigger);

const ARCHIVE_INTRO = {
  title: "[2026]",
  body: [
    "Aquest espai reuneix els",
    "projectes creats durant el curs",
    "d’Art i Cultura Digital i",
    "Laboratori de Creacions Artístiques.",
    "",
    "Un espai per descobrir processos",
    "creatius, peces digitals i mirades",
    "artístiques del curs.",
    "",
    "Cada projecte inclou una breu",
    "explicació, materials visuals i",
    "informació sobre l’autor o autora,",
    "mostrant diferents maneres",
    "d’explorar la creació digital.",
  ],
  stats: [
    { label: "Projectes", value: "10" },
    { label: "Autors", value: "20" },
    { label: "Curs", value: "2025-2026" },
  ],
};

const ASCII_LOADER_LINES = [
  "01000001 01010010 01010100 00101111 01000011 01010101 01001100 01010100",
  "LOAD::ARXIU_DIGITAL  ////  PROJECTES_VISUALS  ////  AUDIOVISUAL",
  "████░░░░░░ ████░░░░░░ ████░░░░░░ ████░░░░░░ ████░░░░░░",
  "A+C+D / LAB_CREACIONS / MATERIAL / AUTORS / INDEX / 000000",
  "00110000 00110001 00110010 00110011 00110100 00110101",
  "///// UN_ESPAI_DIGITAL ///// REUNINT_PROJECTES /////",
  "░░██░░██░░██░░██░░██░░██░░██░░██░░██░░██░░██░░██░░██",
  "BUFFERING_CONTEXT BUFFERING_CONTEXT BUFFERING_CONTEXT",
];

export default function ArchiveIntroSection() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [typingActive, setTypingActive] = useState(false);
  const sectionRef = useRef(null);
  const layoutRef  = useRef(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    const markAsLoaded = () => setIsLoaded(true);

    if (document.readyState === "complete") {
      markAsLoaded();
      return;
    }

    window.addEventListener("load", markAsLoaded, { once: true });

    return () => {
      window.removeEventListener("load", markAsLoaded);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const track = section.closest(".horizontal-track");
    if (!track) return undefined;

    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: () => `+=${Math.max(0, track.scrollWidth - window.innerWidth)}`,
      scrub: true,
      onUpdate: (self) => {
        const totalDistance = track.scrollWidth - window.innerWidth;
        if (totalDistance <= 0) return;
        const scrollX = totalDistance * self.progress;
        const sectionLeft = section.offsetLeft;
        const sectionWidth = section.offsetWidth;
        const localProgress = (scrollX - sectionLeft + window.innerWidth) / (sectionWidth + window.innerWidth);
        const clamped = Math.max(0, Math.min(1, localProgress));
        scrollProgressRef.current = clamped;

        // entrada per escala + desenfocament — distint del slide horitzontal de SectionDivider
        // (no usa y/x per evitar el retall de overflow:hidden del contenidor)
        const layout = layoutRef.current;
        if (!layout) return;

        const smoothstep = (t) => t * t * (3 - 2 * t);

        const ep = smoothstep(Math.min(1, clamped / 0.2));

        if (ep > 0.1) setTypingActive(true);

        const blurPx = (1 - ep) * 12;
        const sc = 0.94 + ep * 0.06;
        gsap.set(layout, {
          opacity: ep,
          scale: sc,
          filter: `blur(${blurPx.toFixed(2)}px)`,
          x: 0,
          y: 0,
        });

        const footer = section.querySelector(".archive-intro-footer");
        if (footer) {
          const fp = smoothstep(Math.min(1, Math.max(0, (clamped - 0.15) / 0.5)));
          gsap.set(footer, {
            opacity: fp * 0.60,
            filter: "blur(0px)",
            x: 0,
            y: 0,
          });
        }
      },
    });

    return () => trigger.kill();
  }, []);


  const sectionStateClass = isLoaded ? "is-loaded" : "is-loading";

  const handlePointerMove = (e) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerLeave = () => {
    mouseRef.current = { x: -999, y: -999 };
  };

  return (
    <article
      ref={sectionRef}
      className={`project-info-page archive-intro-section horizontal-panel ${sectionStateClass}`}
      aria-labelledby="archive-intro-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >

      <AsciiBackground color="#FF0000" opacity={0.12} pointerRef={mouseRef} scrollProgressRef={scrollProgressRef} />

      {!isLoaded && (
        <div className="archive-intro-loader" aria-hidden="true">
          {ASCII_LOADER_LINES.map((line, index) => (
            <span key={`loader-line-${index}`}>{line}</span>
          ))}
        </div>
      )}

      <div ref={layoutRef} className="archive-intro-layout" style={{ opacity: 0 }}>
        <div className="project-info-body archive-intro-copy">
          {ARCHIVE_INTRO.body.map((line, index) => {
            const SPEED = 8;
            const INITIAL = 80;
            const delay = ARCHIVE_INTRO.body
              .slice(0, index)
              .reduce((acc, l) => acc + (l.length > 0 ? l.length * SPEED : 80), INITIAL);
            return (
              <TypeLine
                key={`archive-line-${index}`}
                text={line}
                delay={delay}
                speed={SPEED}
                trigger={typingActive}
                aria-label={line}
                style={undefined}
              />
            );
          })}
        </div>

        <div className="archive-intro-stats" aria-label="Dades de l'arxiu">
          {ARCHIVE_INTRO.stats.map((stat, index) => (
            <div key={stat.label} className="archive-intro-stat">
              <TypeLine
                text={`${stat.label}: ${stat.value}`}
                delay={3000 + index * 220}
                speed={8}
                trigger={typingActive}
                aria-label={`${stat.label}: ${stat.value}`}
              />
            </div>
          ))}
        </div>

      </div>

      <div className="archive-intro-footer" aria-hidden="true">
        <ShuffleText text="[ ARXIU_2026 ]" interval={3000} duration={600} />
      </div>
    </article>
  );
}
