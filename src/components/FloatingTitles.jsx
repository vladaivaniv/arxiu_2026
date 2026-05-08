import { useEffect, useRef } from "react";

const TITLES = [
  "KASY", "POLAR ROOM", "INDEX 04", "SIGNAL",
  "FORMA_01", "ARXIU", "SENYAL", "MATÈRIA", "ESPAI_02", "CODI_X"
];

const SPEED = 40; // ms per char

function rand(a, b) { return a + Math.random() * (b - a); }

export default function FloatingTitles() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const instances = [];
    let running = true;

    const spawnOne = () => {
      if (!running) return;

      const title = TITLES[Math.floor(Math.random() * TITLES.length)];
      const el = document.createElement("span");
      el.style.cssText = `
        position: absolute;
        left: ${rand(4, 82)}%;
        top: ${rand(8, 78)}%;
        font-family: 'Space Mono', monospace;
        font-size: ${rand(8, 13)}px;
        letter-spacing: 0.2em;
        color: #ffffff;
        opacity: 0;
        pointer-events: none;
        white-space: nowrap;
        z-index: 3;
        transition: opacity 0.4s ease;
      `;
      container.appendChild(el);

      // type out
      let i = 0;
      let displayed = "";
      const typeInterval = setInterval(() => {
        if (i < title.length) {
          displayed += title[i++];
          el.textContent = displayed + "_";
          el.style.opacity = "0.6";
        } else {
          el.textContent = displayed;
          clearInterval(typeInterval);

          // hold then fade out
          setTimeout(() => {
            el.style.opacity = "0";
            setTimeout(() => {
              el.remove();
            }, 500);
          }, rand(800, 2200));
        }
      }, SPEED);

      instances.push({ el, interval: typeInterval });

      // schedule next spawn
      setTimeout(spawnOne, rand(1800, 3500));
    };

    // start with two
    setTimeout(spawnOne, rand(0, 400));
    setTimeout(spawnOne, rand(400, 900));

    return () => {
      running = false;
      instances.forEach(({ el, interval }) => {
        clearInterval(interval);
        el.remove();
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3, overflow: "hidden" }}
    />
  );
}
