import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ShuffleText from "./ShuffleText.jsx";
import TypeLine from "./TypeLine.jsx";
import AsciiScatter from "./AsciiScatter.jsx";
import FloatingTitles from "./FloatingTitles.jsx";

gsap.registerPlugin(ScrollTrigger);

const INITIAL_SURFACE_SCALE = 0.94;
const INITIAL_SURFACE_BLUR = 16;
const INITIAL_LAYOUT_BLUR = 12;
const INITIAL_SUBTITLE_BLUR = 8;
const INITIAL_CORNER_BLUR = 6;
const MOTION_READY_THRESHOLD = 0.795;
const DEFAULT_BLUR_END_PROGRESS = 0.7;
const SUBTITLE_REVEAL_OFFSET = 0.24;
const SUBTITLE_REVEAL_WINDOW = 0.7;
const CORNER_REVEAL_OFFSET = 0.3;
const CORNER_REVEAL_WINDOW = 0.68;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function normalizeBlurEndProgress(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_BLUR_END_PROGRESS;
  }

  if (value > 1) {
    return clamp01(value / 100);
  }

  return clamp01(value);
}

function setBlurReveal(node, {
  progress,
  blur,
  opacity = progress,
  scale = 1,
  x = 0,
  y = 0,
}) {
  if (!node) return;

  gsap.set(node, {
    opacity,
    scale,
    filter: `blur(${((1 - progress) * blur).toFixed(2)}px)`,
    x,
    y,
  });
}

export default function SectionDivider({
  titleLines,
  subtitle,
  blurEndPercent = DEFAULT_BLUR_END_PROGRESS * 100,
}) {
  const sectionRef = useRef(null);
  const surfaceRef = useRef(null);
  const layoutRef = useRef(null);
  const subtitleRef = useRef(null);
  const cornerRef = useRef(null);
  const [typingActive, setTypingActive] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const blurEndProgress = normalizeBlurEndProgress(blurEndPercent);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const track = section.closest(".horizontal-track");
    if (!track) return;

    const surface = surfaceRef.current;
    const layout = layoutRef.current;
    const subtitleNode = subtitleRef.current;
    const corner = cornerRef.current;

    // Estat inicial: la pantalla existeix des del primer frame, però entra tapada
    // amb blur i una escala lleugerament reduïda.
    gsap.set(surface, {
      opacity: 0,
      scale: INITIAL_SURFACE_SCALE,
      filter: `blur(${INITIAL_SURFACE_BLUR}px)`,
      x: 0,
      y: 0,
    });
    gsap.set(layout, {
      opacity: 0,
      filter: `blur(${INITIAL_LAYOUT_BLUR}px)`,
      x: 0,
      y: 0,
    });
    gsap.set(subtitleNode, {
      opacity: 0,
      filter: `blur(${INITIAL_SUBTITLE_BLUR}px)`,
      x: 0,
      y: 0,
    });
    gsap.set(corner, {
      opacity: 0,
      filter: `blur(${INITIAL_CORNER_BLUR}px)`,
      x: 0,
      y: 0,
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
        const sectionLeft = section.offsetLeft;
        const viewportWidth = window.innerWidth;
        // Progrés local del divider:
        // 0 = tot just comença a entrar per la dreta
        // 1 = el panell ja s'ha alineat completament al viewport
        const localProgress = clamp01(
          (scrollX - (sectionLeft - viewportWidth)) / viewportWidth,
        );

        const surfaceProgress = smoothstep(localProgress / blurEndProgress);
        const surfaceScale = INITIAL_SURFACE_SCALE + surfaceProgress * 0.06;
        setBlurReveal(surface, {
          progress: surfaceProgress,
          blur: INITIAL_SURFACE_BLUR,
          scale: surfaceScale,
          x: (1 - surfaceProgress) * 140,
        });

        setBlurReveal(layout, {
          progress: surfaceProgress,
          blur: INITIAL_LAYOUT_BLUR,
          x: (1 - surfaceProgress) * 220,
          y: (1 - surfaceProgress) * 36,
        });

        const subtitleProgress = smoothstep(
          (localProgress - SUBTITLE_REVEAL_OFFSET) / SUBTITLE_REVEAL_WINDOW,
        );
        setBlurReveal(subtitleNode, {
          progress: subtitleProgress,
          blur: INITIAL_SUBTITLE_BLUR,
          x: (1 - subtitleProgress) * 160,
          y: (1 - subtitleProgress) * 12,
        });

        const cornerProgress = smoothstep(
          (localProgress - CORNER_REVEAL_OFFSET) / CORNER_REVEAL_WINDOW,
        );
        setBlurReveal(corner, {
          progress: cornerProgress,
          blur: INITIAL_CORNER_BLUR,
          opacity: cornerProgress * 0.7,
          x: (1 - cornerProgress) * 72,
          y: (1 - cornerProgress) * 44,
        });

        // El moviment intern queda bloquejat fins que la pantalla ja és prou present.
        if (localProgress >= MOTION_READY_THRESHOLD) {
          setMotionReady(true);
          setTypingActive(true);
        } else {
          setMotionReady(false);
          setTypingActive(false);
        }
      },
    });

    return () => trigger.kill();
  }, [blurEndProgress]);

  return (
    <div ref={sectionRef} className="section-divider horizontal-panel">
      <div ref={surfaceRef} className="section-divider-surface">
        <div className="section-divider-photo" aria-hidden="true" />
        <AsciiScatter fullSpread count={25} maxOpacity={0.18} active={motionReady} />
        <div className="section-divider-bg" aria-hidden="true" />
        <FloatingTitles active={motionReady} />

        <div className="section-divider-inner" ref={layoutRef}>
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
                trigger={motionReady}
                // El títol es veu des del primer moment, i el blur global de la
                // pantalla és qui el "vela" fins que l'entrada es resol.
                initialTextVisible
              />
            ))}
          </div>

          <div
            className={`section-divider-line${motionReady ? " is-motion-ready" : ""}`}
            aria-hidden="true"
          />
        </div>

        <div ref={subtitleRef} className="section-divider-subtitle-wrap">
          <TypeLine
            as="p"
            className="section-divider-subtitle"
            text={subtitle}
            delay={300}
            speed={8}
            trigger={typingActive}
          />
        </div>

        <div
          ref={cornerRef}
          className="section-divider-corner section-divider-corner--br"
          aria-hidden="true"
        >
          <span>2025–2026</span>
        </div>
      </div>

    </div>
  );
}
