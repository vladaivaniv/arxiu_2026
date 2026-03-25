import { useEffect, useState } from "react";

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
  text,
  delay = 0,
  interval = 3200,
  duration = 850,
  className,
}) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    setDisplayText(text);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timeoutId = 0;
    let frameId = 0;

    const schedule = (wait) => {
      timeoutId = window.setTimeout(runShuffle, wait);
    };

    const runShuffle = () => {
      if (mediaQuery.matches) {
        setDisplayText(text);
        schedule(interval + Math.random() * 1800);
        return;
      }

      const startTime = performance.now();
      const seed = Math.floor(Math.random() * 1000);

      const animate = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        setDisplayText(scrambleText(text, progress, seed));

        if (progress < 1) {
          frameId = window.requestAnimationFrame(animate);
          return;
        }

        setDisplayText(text);
        schedule(interval + Math.random() * 1800);
      };

      frameId = window.requestAnimationFrame(animate);
    };

    schedule(delay);

    const handleMotionChange = () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
      setDisplayText(text);
      schedule(delay);
    };

    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, [delay, duration, interval, text]);

  return <p className={className}>{displayText}</p>;
}
