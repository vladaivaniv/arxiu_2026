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
  const innerRef = useRef(null);
  const subtitleRef = useRef(null);
  const [typingActive, setTypingActive] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const track = section.closest(".horizontal-track");
    if (!track) return;

    // autoAlpha sets both opacity AND visibility:hidden atomically — no flash possible
    gsap.set(innerRef.current, { autoAlpha: 0, x: 160 });
    gsap.set(subtitleRef.current, { autoAlpha: 0, x: 120 });

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
        const sectionWidth = section.offsetWidth;
        const localProgress = (scrollX - sectionLeft + window.innerWidth) / (sectionWidth + window.innerWidth);
        const clamped = Math.max(0, Math.min(1, localProgress));

        // Només apareix quan la secció ja és completament dins el viewport
        const ep = smoothstep(Math.min(1, Math.max(0, (clamped - 0.5) / 0.22)));
        const inner = innerRef.current;
        if (inner) {
          gsap.set(inner, { autoAlpha: ep, x: (1 - ep) * 200 });
        }

        const sub = subtitleRef.current;
        if (sub) {
          const sp = smoothstep(Math.min(1, Math.max(0, (clamped - 0.58) / 0.22)));
          gsap.set(sub, { autoAlpha: sp, x: (1 - sp) * 150 });
        }

        if (clamped > 0.62) setTypingActive(true);
        else setTypingActive(false);
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <>
      <div ref={sectionRef} className="section-divider horizontal-panel">
      <div className="section-divider-photo" aria-hidden="true" />
      <AsciiScatter fullSpread count={25} maxOpacity={0.18} />
      <div className="section-divider-bg" aria-hidden="true" />
      <FloatingTitles />

      <div className="section-divider-inner" ref={innerRef}>
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

      <div className="section-divider-corner section-divider-corner--br" aria-hidden="true">
        <span>2025–2026</span>
      </div> 

      </div>
    </>
  );
}
