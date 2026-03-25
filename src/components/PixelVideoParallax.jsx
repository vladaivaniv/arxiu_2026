import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function PixelVideoParallax({
  src,
  title,
  caption,
  driftDirection = 1,
  stackIndex = 0,
}) {
  const sectionRef = useRef(null);
  const frameRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const video = videoRef.current;

    if (!section || !frame || !video) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationContext;

    const ensurePlayback = () => {
      video.play().catch(() => {});
    };

    const setupAnimation = () => {
      animationContext?.revert();

      animationContext = gsap.context(() => {
        if (mediaQuery.matches) {
          gsap.set(frame, { clearProps: "transform" });
          gsap.set(video, { clearProps: "transform" });
          return;
        }

        gsap.set(frame, {
          yPercent: 18 * driftDirection,
          scale: 0.965,
          transformOrigin: "center center",
        });

        gsap.set(video, {
          yPercent: -16 * driftDirection,
          scale: 1.1,
          transformOrigin: "center center",
        });

        gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
          .to(
            frame,
            {
              yPercent: 0,
              scale: 1,
            },
            0,
          )
          .to(
            video,
            {
              yPercent: 0,
              scale: 1.015,
            },
            0,
          );
      }, section);

      ScrollTrigger.refresh();
    };

    ensurePlayback();
    setupAnimation();

    const handleLoadedData = () => {
      ensurePlayback();
      ScrollTrigger.refresh();
    };

    const handleMotionChange = () => {
      setupAnimation();
    };

    video.addEventListener("loadeddata", handleLoadedData);
    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      animationContext?.revert();
      video.removeEventListener("loadeddata", handleLoadedData);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, [driftDirection, src]);

  return (
    <section
      ref={sectionRef}
      className="video-parallax-section"
      style={{ zIndex: stackIndex + 1 }}
    >
      <div className="video-stage">
        <div ref={frameRef} className="video-frame">
          <video
            ref={videoRef}
            className="video-source"
            src={src}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
          <div className="video-overlay" aria-hidden="true" />
          <div className="video-meta">
            <p>{title}</p>
            <p>{caption}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
