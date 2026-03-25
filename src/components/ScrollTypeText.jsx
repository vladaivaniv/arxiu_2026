import { createElement, useEffect, useRef, useState } from "react";

export default function ScrollTypeText({
  as = "p",
  text,
  className,
  delay = 0,
  speed = 28,
  threshold = 0.35,
  ...props
}) {
  const elementRef = useRef(null);
  const startedRef = useRef(false);
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let timeoutId = 0;
    let observer;

    startedRef.current = false;
    setDisplayText("");

    const revealText = () => {
      if (startedRef.current) {
        return;
      }

      startedRef.current = true;

      if (mediaQuery.matches) {
        setDisplayText(text);
        return;
      }

      const startAnimation = () => {
        const startTime = performance.now();

        const animate = (now) => {
          const elapsed = now - startTime;
          const characterCount = Math.min(
            text.length,
            Math.ceil(elapsed / Math.max(speed, 10)),
          );

          setDisplayText(text.slice(0, characterCount));

          if (characterCount < text.length) {
            frameId = window.requestAnimationFrame(animate);
          }
        };

        frameId = window.requestAnimationFrame(animate);
      };

      timeoutId = window.setTimeout(startAnimation, delay);
    };

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          revealText();
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(element);

    const handleMotionChange = () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);

      if (mediaQuery.matches && startedRef.current) {
        setDisplayText(text);
      }
    };

    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      observer?.disconnect();
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, [delay, speed, text, threshold]);

  return createElement(
    as,
    {
      ref: elementRef,
      className,
      "aria-label": text,
      ...props,
    },
    displayText,
  );
}
