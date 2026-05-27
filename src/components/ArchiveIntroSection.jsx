import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
    { label: "Autors", value: "19" },
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
  const copyRef = useRef(null);
  const statsRef = useRef(null);
  const hintRef = useRef(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    const hint = hintRef.current;
    if (!hint || !typingActive) return undefined;

    let raf = 0;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let hovering = false;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onEnter = () => { hovering = true; };
    const onLeave = () => { hovering = false; };

    const tick = () => {
      if (!hovering) {
        const targetX = mouseX + 90;
        const targetY = mouseY - 40;
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        hint.style.left = `${currentX}px`;
        hint.style.top = `${currentY}px`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    hint.addEventListener("mouseenter", onEnter);
    hint.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      hint.removeEventListener("mouseenter", onEnter);
      hint.removeEventListener("mouseleave", onLeave);
    };
  }, [typingActive]);

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
        const rect = section.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const localProgress = (viewportWidth - rect.left) / (viewportWidth * 0.92);
        const clamped = Math.max(0, Math.min(1, localProgress));
        scrollProgressRef.current = clamped;

        const layout = layoutRef.current;
        if (!layout) return;
        const copy = copyRef.current;
        const stats = statsRef.current;

        const smoothstep = (t) => t * t * (3 - 2 * t);

        const ep = smoothstep(Math.min(1, Math.max(0, (clamped - 0.06) / 0.32)));
        const copyProgress = smoothstep(Math.min(1, Math.max(0, (clamped - 0.14) / 0.34)));
        const statsProgress = smoothstep(Math.min(1, Math.max(0, (clamped - 0.24) / 0.3)));

        const isInView = rect.right > 0 && rect.left < viewportWidth;
        if (isInView && ep > 0.1) setTypingActive(true);
        else if (!isInView || ep < 0.02) setTypingActive(false);

        gsap.set(layout, {
          opacity: ep,
          scale: 1,
          filter: "blur(0px)",
          x: 0,
          y: 0,
        });

        if (copy) {
          gsap.set(copy, {
            opacity: copyProgress,
            x: (1 - copyProgress) * 220,
            y: 0,
            filter: "blur(0px)",
          });
        }

        if (stats) {
          gsap.set(stats, {
            opacity: statsProgress,
            x: (1 - statsProgress) * 280,
            y: 0,
            filter: "blur(0px)",
          });
        }

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
        <div ref={copyRef} className="project-info-body archive-intro-copy" style={{ opacity: 0 }}>
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

        <div ref={statsRef} className="archive-intro-stats" aria-label="Indicacions d'ús" style={{ opacity: 0 }} />
        {typeof document !== "undefined" && createPortal(
          <div ref={hintRef} className={`archive-intro-hint${typingActive ? " is-visible" : ""}`}>
            <p className="archive-intro-hint-text">
              <span className="archive-intro-hint-line"><span className="archive-intro-hint-prefix" aria-hidden="true">//</span> Mou el cursor sobre cada projecte</span>
              <span className="archive-intro-hint-line">per activar la seva interacció.</span>
            </p>
          </div>,
          document.body,
        )}

      </div>

      <div className="archive-intro-footer" aria-hidden="true">
        <ShuffleText text="[ ARXIU_2026 ]" interval={3000} duration={600} />
      </div>
    </article>
  );
}
