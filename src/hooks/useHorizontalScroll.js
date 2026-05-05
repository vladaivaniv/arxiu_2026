import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function useHorizontalScroll({ shellRef, viewportRef, trackRef }) {
  useEffect(() => {
    const shell = shellRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!shell || !viewport || !track) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationContext;
    let resizeObserver;
    const refreshScroll = gsap.delayedCall(0.16, () => {
      ScrollTrigger.refresh();
    }).pause();

    const setupHorizontalScroll = () => {
      animationContext?.revert();

      animationContext = gsap.context(() => {
        gsap.set(track, { x: 0, force3D: true });

        if (mediaQuery.matches) {
          return;
        }

        const getDistance = () =>
          Math.max(0, track.scrollWidth - viewport.clientWidth);

        const updateProjectChromeVisibility = (scrollProgress) => {
          const distance = getDistance();
          const worksSection = track.querySelector(".works-section");

          if (!distance || !worksSection) {
            viewport.classList.remove("is-projects-active");
            viewport.style.setProperty("--hero-project-transition", "0");
            return;
          }

          const scrollX = distance * scrollProgress;
          const start = worksSection.offsetLeft - 2;
          const end =
            worksSection.offsetLeft + worksSection.scrollWidth - viewport.clientWidth + 2;

          viewport.classList.toggle(
            "is-projects-active",
            scrollX >= start && scrollX <= end,
          );

          const transitionStart = worksSection.offsetLeft - viewport.clientWidth;
          const transitionEnd = worksSection.offsetLeft;
          const transitionRange = Math.max(1, transitionEnd - transitionStart);
          const transitionProgress = Math.min(
            1,
            Math.max(0, (scrollX - transitionStart) / transitionRange),
          );

          viewport.style.setProperty(
            "--hero-project-transition",
            transitionProgress.toFixed(4),
          );
        };

        gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          overwrite: "auto",
          scrollTrigger: {
            trigger: shell,
            pin: viewport,
            start: "top top",
            end: () => `+=${getDistance()}`,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: (self) => updateProjectChromeVisibility(self.progress),
            onUpdate: (self) => updateProjectChromeVisibility(self.progress),
          },
        });
      }, shell);

      refreshScroll.restart(true);
    };

    setupHorizontalScroll();
    resizeObserver = new ResizeObserver(() => refreshScroll.restart(true));
    resizeObserver.observe(track);

    const handleMotionChange = () => {
      setupHorizontalScroll();
    };

    mediaQuery.addEventListener("change", handleMotionChange);
    window.addEventListener("load", ScrollTrigger.refresh);

    return () => {
      animationContext?.revert();
      viewport.classList.remove("is-projects-active");
      viewport.style.removeProperty("--hero-project-transition");
      refreshScroll.kill();
      resizeObserver?.disconnect();
      mediaQuery.removeEventListener("change", handleMotionChange);
      window.removeEventListener("load", ScrollTrigger.refresh);
    };
  }, [shellRef, viewportRef, trackRef]);
}
