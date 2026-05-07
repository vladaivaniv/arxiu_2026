import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function useHorizontalScroll({ shellRef, viewportRef, trackRef }) {
  useLayoutEffect(() => {
    const shell = shellRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!shell || !viewport || !track) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationContext;
    let resizeObserver;
    let fontsReadyFrame = 0;
    const refreshScroll = gsap.delayedCall(0.16, () => {
      ScrollTrigger.refresh();
    }).pause();

    const setupHorizontalScroll = () => {
      animationContext?.revert();

      animationContext = gsap.context(() => {
        gsap.set(track, { x: 0, force3D: true });

        if (mediaQuery.matches) {
          shell.style.height = "";
          return;
        }

        const getDistance = () =>
          Math.max(0, track.scrollWidth - viewport.clientWidth);

        const applyShellHeight = () => {
          shell.style.height = `${getDistance() + window.innerHeight}px`;
        };
        applyShellHeight();

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

          const dividers = Array.from(track.querySelectorAll(".section-divider"));
          const isOnDivider = dividers.some((d) => {
            const dAbsLeft = d.getBoundingClientRect().left + scrollX;
            return Math.abs(scrollX - dAbsLeft) < viewport.clientWidth * 0.5;
          });
          viewport.classList.toggle("is-on-divider", isOnDivider);
        };

        const getSnapPoints = () => {
          const distance = getDistance();
          if (!distance) return [0];
          const panels = Array.from(track.querySelectorAll(".horizontal-panel"));
          const points = panels.map((p) =>
            Math.max(0, Math.min(1, p.offsetLeft / distance)),
          );
          return [...new Set([0, ...points, 1])].sort((a, b) => a - b);
        };

        const mainTween = gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          overwrite: "auto",
          scrollTrigger: {
            trigger: shell,
            start: "top top",
            end: () => `+=${getDistance()}`,
            scrub: 1.5,
            snap: {
              snapTo: getSnapPoints,
              duration: { min: 1.0, max: 2.2 },
              delay: 0.05,
              ease: "power4.inOut",
            },
            invalidateOnRefresh: true,
            onRefreshInit: applyShellHeight,
            onRefresh: (self) => updateProjectChromeVisibility(self.progress),
            onUpdate: (self) => updateProjectChromeVisibility(self.progress),
          },
        });

        // Transició suau entre pàgines: blur + fade + scale quan surten
        const panels = track.querySelectorAll(".horizontal-panel");
        panels.forEach((panel) => {
          gsap.fromTo(
            panel,
            { filter: "blur(0px)", opacity: 1, scale: 1 },
            {
              filter: "blur(10px)",
              opacity: 0,
              scale: 0.96,
              ease: "power2.in",
              scrollTrigger: {
                trigger: panel,
                containerAnimation: mainTween,
                start: "left left",
                end: "right left",
                scrub: true,
              },
            }
          );
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

    const handleLoad = () => {
      refreshScroll.restart(true);
    };

    const handleFontsReady = () => {
      window.cancelAnimationFrame(fontsReadyFrame);
      fontsReadyFrame = window.requestAnimationFrame(() => {
        setupHorizontalScroll();
      });
    };

    mediaQuery.addEventListener("change", handleMotionChange);
    window.addEventListener("load", handleLoad);

    if (document.fonts?.ready) {
      document.fonts.ready.then(handleFontsReady).catch(() => {});
    }

    return () => {
      animationContext?.revert();
      window.cancelAnimationFrame(fontsReadyFrame);
      viewport.classList.remove("is-projects-active");
      viewport.style.removeProperty("--hero-project-transition");
      shell.style.height = "";
      refreshScroll.kill();
      resizeObserver?.disconnect();
      mediaQuery.removeEventListener("change", handleMotionChange);
      window.removeEventListener("load", handleLoad);
    };
  }, [shellRef, viewportRef, trackRef]);
}
