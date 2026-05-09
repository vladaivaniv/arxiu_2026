import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ShuffleText from "./ShuffleText.jsx";
import TypeLine from "./TypeLine.jsx";
import AsciiScatter from "./AsciiScatter.jsx";
import FloatingTitles from "./FloatingTitles.jsx";

gsap.registerPlugin(ScrollTrigger);

export default function SectionDivider({ titleLines, subtitle }) {
  const sectionRef = useRef(null);
  const surfaceRef = useRef(null);
  const layoutRef = useRef(null);
  const subtitleRef = useRef(null);
  const cornerRef = useRef(null);
  const [typingActive, setTypingActive] = useState(false);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const track = section.closest(".horizontal-track");
    if (!track) return;

    const surface = surfaceRef.current;
    const layout = layoutRef.current;
    const subtitleNode = subtitleRef.current;
    const corner = cornerRef.current;

    gsap.set(surface, {
      opacity: 0,
      scale: 0.94,
      filter: "blur(16px)",
      x: 0,
      y: 0,
    });
    gsap.set(layout, {
      opacity: 0,
      filter: "blur(12px)",
      x: 0,
      y: 0,
    });
    gsap.set(subtitleNode, {
      opacity: 0,
      filter: "blur(8px)",
      x: 0,
      y: 0,
    });
    gsap.set(corner, {
      opacity: 0,
      filter: "blur(6px)",
      x: 0,
      y: 0,
    });

    const smoothstep = (t) => t * t * (3 - 2 * t);

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
        const revealProgress = (scrollX - (sectionLeft - viewportWidth)) / viewportWidth;
        const clamped = Math.max(0, Math.min(1, revealProgress));

        // En un panell separat de 100vw, volem que l'entrada estigui completada
        // quan la pàgina ja està alineada al viewport.
        const ep = smoothstep(clamped);
        const surfaceBlur = (1 - ep) * 16;
        const surfaceScale = 0.94 + ep * 0.06;

        if (surface) {
          gsap.set(surface, {
            opacity: ep,
            scale: surfaceScale,
            filter: `blur(${surfaceBlur.toFixed(2)}px)`,
            x: 0,
            y: 0,
          });
        }

        const blurPx = (1 - ep) * 12;

        if (layout) {
          gsap.set(layout, {
            opacity: ep,
            filter: `blur(${blurPx.toFixed(2)}px)`,
            x: 0,
            y: 0,
          });
        }

        if (subtitleNode) {
          const sp = smoothstep(Math.min(1, Math.max(0, (clamped - 0.18) / 0.52)));
          const subtitleBlur = (1 - sp) * 8;
          gsap.set(subtitleNode, {
            opacity: sp,
            filter: `blur(${subtitleBlur.toFixed(2)}px)`,
            x: 0,
            y: 0,
          });
        }

        if (corner) {
          const cp = smoothstep(Math.min(1, Math.max(0, (clamped - 0.22) / 0.5)));
          const cornerBlur = (1 - cp) * 6;
          gsap.set(corner, {
            opacity: cp * 0.7,
            filter: `blur(${cornerBlur.toFixed(2)}px)`,
            x: 0,
            y: 0,
          });
        }

        if (clamped >= 0.795) {
          setMotionReady(true);
          setTypingActive(true);
        } else {
          setMotionReady(false);
          setTypingActive(false);
        }
      },
    });

    return () => trigger.kill();
  }, []);

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
