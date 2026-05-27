import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

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
          const worksSections = Array.from(track.querySelectorAll(".works-section"));
          const archiveIntro = track.querySelector(".archive-intro-section");

          if (!distance || !worksSections.length) {
            viewport.classList.remove("is-projects-active");
            viewport.style.setProperty("--hero-project-transition", "0");
            return;
          }

          const scrollX = distance * scrollProgress;
          const activeWorksSection = worksSections.find((worksSection) => {
            const start = worksSection.offsetLeft - 2;
            const end =
              worksSection.offsetLeft + worksSection.scrollWidth - viewport.clientWidth + 2;
            return scrollX >= start && scrollX <= end;
          });

          const inArchiveIntro =
            archiveIntro &&
            Math.abs(scrollX - archiveIntro.offsetLeft) < viewport.clientWidth * 0.55;

          viewport.classList.toggle(
            "is-projects-active",
            Boolean(activeWorksSection) || Boolean(inArchiveIntro),
          );
          viewport.classList.toggle(
            "is-archive-intro",
            Boolean(inArchiveIntro) && !activeWorksSection,
          );

          const transitionTarget = activeWorksSection ?? worksSections[0];
          const transitionStart = transitionTarget.offsetLeft - viewport.clientWidth;
          const transitionEnd = transitionTarget.offsetLeft;
          const transitionRange = Math.max(1, transitionEnd - transitionStart);
          const transitionProgress = Math.min(1, Math.max(0, (scrollX - transitionStart) / transitionRange));

          viewport.style.setProperty(
            "--hero-project-transition",
            transitionProgress.toFixed(4),
          );

          const dividers = Array.from(track.querySelectorAll(".section-divider"));
          const isOnDivider = dividers.some((d) => {
            const dAbsLeft = d.getBoundingClientRect().left + scrollX;
            // Tighter window: chrome stays visible longer on the project before/after a divider
            return Math.abs(scrollX - dAbsLeft) < viewport.clientWidth * 0.22;
          });
          viewport.classList.toggle("is-on-divider", isOnDivider);
        };

        const mainTween = gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          overwrite: "auto",
          scrollTrigger: {
            trigger: shell,
            start: "top top",
            end: () => `+=${getDistance()}`,
            scrub: 0.5,
            invalidateOnRefresh: true,
            onRefreshInit: applyShellHeight,
            onRefresh: (self) => updateProjectChromeVisibility(self.progress),
            onUpdate: (self) => updateProjectChromeVisibility(self.progress),
          },
        });

        // Transicio suau entre pagines: mantenim blur, pero en subcapes
        // mes petites en comptes del panell sencer per evitar tirons.
        const panels = track.querySelectorAll(".horizontal-panel");
        panels.forEach((panel) => {
          const blurTargets = panel.querySelectorAll(
            ".wc-left, .wc-media-frame, .wc-gallery-strip",
          );
          const targets = blurTargets.length ? blurTargets : [panel];

          gsap.fromTo(
            targets,
            { filter: "blur(0px)", opacity: 1 },
            {
              filter: "blur(2px)",
              opacity: 0.96,
              ease: "none",
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

    // ── unified panel-by-panel navigation ──────────────────────
    const getDistanceOuter = () =>
      Math.max(0, track.scrollWidth - viewport.clientWidth);

    const getSnapTargets = () => {
      const distance = getDistanceOuter();
      if (!distance) return [0];
      const panels = Array.from(track.querySelectorAll(".horizontal-panel"));
      const trackLeft = track.getBoundingClientRect().left;
      const offsets = panels.map((p) => {
        const left = p.getBoundingClientRect().left - trackLeft;
        return Math.min(distance, Math.max(0, Math.round(left)));
      });
      if (!offsets.includes(distance)) offsets.push(distance);
      return Array.from(new Set(offsets)).sort((a, b) => a - b);
    };

    let navBusy = false;
    let navReleaseTimer = 0;

    const navigateBy = (direction) => {
      const distance = getDistanceOuter();
      if (!distance) return false;
      const targets = getSnapTargets();
      const current = window.scrollY;
      let target;
      if (direction > 0) {
        target = targets.find((t) => t > current + 4) ?? targets[targets.length - 1];
      } else {
        target = [...targets].reverse().find((t) => t < current - 4) ?? targets[0];
      }
      if (target === current) return false;
      navBusy = true;
      const lenis = window.__lenis;
      const release = () => {
        window.clearTimeout(navReleaseTimer);
        navReleaseTimer = window.setTimeout(() => { navBusy = false; }, 80);
      };
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(target, {
          duration: 0.95,
          easing: (t) => 1 - Math.pow(1 - t, 3),
          lock: true,
          onComplete: release,
        });
      } else {
        window.scrollTo({ top: target, behavior: "smooth" });
        window.setTimeout(release, 950);
      }
      return true;
    };

    // wheel / trackpad: detect end-of-gesture, snap on intent
    let wheelLastTime = 0;
    let wheelAccum = 0;
    let wheelLastSign = 0;

    const handleWheel = (e) => {
      if (mediaQuery.matches) return;
      const distance = getDistanceOuter();
      if (!distance) return;
      const scrollY = window.scrollY;
      if (scrollY < 0 || scrollY > distance) return;

      e.preventDefault();
      e.stopPropagation();

      if (navBusy) return;

      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (!delta) return;
      const sign = delta > 0 ? 1 : -1;
      const now = performance.now();

      // reset accumulator on direction change or long pause
      if (sign !== wheelLastSign || now - wheelLastTime > 220) {
        wheelAccum = 0;
      }
      wheelAccum += delta;
      wheelLastTime = now;
      wheelLastSign = sign;

      if (Math.abs(wheelAccum) < 20) return;
      wheelAccum = 0;
      navigateBy(sign);
    };

    const handleKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      let direction = 0;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          direction = 1;
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          direction = -1;
          break;
        case "Home":
          e.preventDefault();
          if (!navBusy) {
            navBusy = true;
            const lenis = window.__lenis;
            const release = () => { navBusy = false; };
            if (lenis) lenis.scrollTo(0, { duration: 1.0, lock: true, onComplete: release });
            else { window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(release, 1000); }
          }
          return;
        case "End":
          e.preventDefault();
          if (!navBusy) {
            const targets = getSnapTargets();
            const target = targets[targets.length - 1];
            navBusy = true;
            const lenis = window.__lenis;
            const release = () => { navBusy = false; };
            if (lenis) lenis.scrollTo(target, { duration: 1.0, lock: true, onComplete: release });
            else { window.scrollTo({ top: target, behavior: "smooth" }); setTimeout(release, 1000); }
          }
          return;
        default:
          return;
      }
      e.preventDefault();
      if (!navBusy) navigateBy(direction);
    };

    mediaQuery.addEventListener("change", handleMotionChange);
    window.addEventListener("load", handleLoad);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });

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
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      window.clearTimeout(navReleaseTimer);
    };
  }, [shellRef, viewportRef, trackRef]);
}
