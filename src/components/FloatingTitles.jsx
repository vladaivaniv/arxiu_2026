import { useEffect, useRef } from "react";

const TITLES = [
  "End of Shift",
  "Blastur",
  "Quan Ningú Mira",
  "El masclisme sempre guanya",
  "Model de poder mitjançant el diàleg mecànic",
  "Privilegiados",
  "Panòptic digital",
  "Measured Self",
  "Allò que projectem",
  "Or de ferralla",
];

const SPEED = 38;
const BATCH = 3;

function rand(a, b) { return a + Math.random() * (b - a); }

export default function FloatingTitles({ active = true }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.querySelectorAll("span").forEach((el) => el.remove());
    if (!active) return undefined;

    let running = true;
    const intervals = [];

    const spawnOne = (delayOffset = 0) => {
      if (!running) return;

      const title = TITLES[Math.floor(Math.random() * TITLES.length)];
      const el = document.createElement("span");
      el.style.cssText = `
        position: absolute;
        left: ${rand(4, 78)}%;
        top: ${rand(8, 76)}%;
        font-family: 'Space Mono', monospace;
        font-size: ${rand(9, 14)}px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #ffffff;
        opacity: 0;
        pointer-events: none;
        white-space: nowrap;
        z-index: 3;
        transition: opacity 0.4s ease;
      `;
      container.appendChild(el);

      let i = 0;
      let displayed = "";
      const t = setTimeout(() => {
        const iv = setInterval(() => {
          if (i < title.length) {
            displayed += title[i++];
            el.textContent = displayed + "_";
            el.style.opacity = "0.55";
          } else {
            el.textContent = displayed;
            clearInterval(iv);
            setTimeout(() => {
              el.style.opacity = "0";
              setTimeout(() => el.remove(), 500);
            }, rand(1200, 3000));
          }
        }, SPEED);
        intervals.push(iv);
      }, delayOffset);
      intervals.push(t);
    };

    const spawnBatch = () => {
      if (!running) return;
      for (let i = 0; i < BATCH; i++) {
        spawnOne(i * rand(200, 500));
      }
      setTimeout(spawnBatch, rand(3500, 5500));
    };

    spawnBatch();

    return () => {
      running = false;
      intervals.forEach(clearInterval);
      container.querySelectorAll("span").forEach(el => el.remove());
    };
  }, [active]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3, overflow: "hidden" }}
    />
  );
}
