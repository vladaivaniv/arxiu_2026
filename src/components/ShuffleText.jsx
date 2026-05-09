import { createElement, useEffect, useRef, useState } from "react";

const SHUFFLE_GLYPHS = "ART4#%+=:*R/TX3ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function isShufflable(char) {
  return /[A-Z0-9]/i.test(char);
}

function randomGlyph(seed, index) {
  return SHUFFLE_GLYPHS[(seed + index * 17) % SHUFFLE_GLYPHS.length];
}

function scrambleText(text, progress, seed) {
  return [...text].map((char, index) => {
    if (!isShufflable(char)) {
      return char;
    }

    const revealPoint = index / Math.max(text.length - 1, 1);
    if (progress >= revealPoint) {
      return char;
    }

    return randomGlyph(seed + Math.floor(progress * 40), index);
  }).join("");
}

export default function ShuffleText({
  as = "p",
  text,
  delay = 0,
  interval = 3200,
  duration = 850,
  className,
  color,
  style,
  triggerOnView = false,
  playOnce = false,
  threshold = 0.35,
  trigger,
  initialTextVisible = true,
  ...props
}) {
  const elementRef = useRef(null);
  const startedRef = useRef(false);
  const externalTrigger = trigger !== undefined;
  const getInitialText = () => {
    if (triggerOnView) return "";
    if (externalTrigger) return initialTextVisible ? text : "";
    return text;
  };
  const [displayText, setDisplayText] = useState(getInitialText);

  useEffect(() => {
    startedRef.current = false;
    setDisplayText(getInitialText());

    if (externalTrigger && !trigger) return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timeoutId = 0;
    let frameId = 0;
    let observer;

    const complete = () => {
      setDisplayText(text);

      if (!triggerOnView && !playOnce) {
        schedule(interval + Math.random() * 1800);
      }
    };

    const schedule = (wait) => {
      timeoutId = window.setTimeout(runShuffle, wait);
    };

    const runShuffle = () => {
      if (mediaQuery.matches) {
        setDisplayText(text);
        if (!triggerOnView && !playOnce) {
          schedule(interval + Math.random() * 1800);
        }
        return;
      }

      const startTime = performance.now();
      const seed = Math.floor(Math.random() * 1000);
      setDisplayText(scrambleText(text, 0, seed));

      const animate = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        setDisplayText(scrambleText(text, progress, seed));

        if (progress < 1) {
          frameId = window.requestAnimationFrame(animate);
          return;
        }

        complete();
      };

      frameId = window.requestAnimationFrame(animate);
    };

    if (externalTrigger) {
      timeoutId = window.setTimeout(runShuffle, delay);
    } else if (triggerOnView) {
      const element = elementRef.current;
      if (!element) {
        return undefined;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting || startedRef.current) {
            return;
          }

          startedRef.current = true;
          timeoutId = window.setTimeout(runShuffle, delay);

          if (playOnce) {
            observer.disconnect();
          }
        },
        {
          threshold,
          rootMargin: "0px 0px -8% 0px",
        },
      );

      observer.observe(element);
    } else {
      schedule(delay);
    }

    const handleMotionChange = () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
      setDisplayText(text);
      if (!triggerOnView) {
        schedule(delay);
      }
    };

    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      observer?.disconnect();
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, [delay, duration, interval, playOnce, text, threshold, triggerOnView, trigger, externalTrigger, initialTextVisible]);

  return createElement(
    as,
    {
      ref: elementRef,
      className,
      style: {
        ...style,
        ...(color ? { color } : null),
      },
      ...props,
    },
    displayText,
  );
}
