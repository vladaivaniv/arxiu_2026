import { useEffect, useRef } from "react";

const TITLES = [
  "KASY", "POLAR ROOM", "INDEX 04", "SIGNAL",
  "FORMA_01", "ARXIU", "SENYAL", "MATÈRIA", "ESPAI_02", "CODI_X"
];

const SPEED = 30;
const COOLDOWN = 400;

function rand(a, b) { return a + Math.random() * (b - a); }

export default function CursorTitles() {
  const containerRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const usedRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const section = container.closest(".section-divider, .horizontal-panel") || container.parentElement;

    const spawn = (mx, my) => {
      const now = Date.now();
      if (now - lastSpawnRef.current < COOLDOWN) return;
      lastSpawnRef.current = now;

      const rect = container.getBoundingClientRect();
      const count = Math.floor(rand(2, 4)); // 2-3 títols alhora

      for (let k = 0; k < count; k++) {
        const title = TITLES[usedRef.current % TITLES.length];
        usedRef.current++;

        const el = document.createElement("span");
        const ox = rand(-120, 120);
        const oy = rand(-60, 60);

        el.style.cssText = `
          position: absolute;
          left: ${mx - rect.left + ox}px;
          top: ${my - rect.top + oy}px;
          font-family: 'Space Mono', monospace;
          font-size: ${rand(8, 12)}px;
          letter-spacing: 0.2em;
          color: #ffffff;
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          z-index: 10;
          transition: opacity 0.25s ease;
        `;
        container.appendChild(el);

        let i = 0;
        let displayed = "";
        const typeInterval = setInterval(() => {
          if (i < title.length) {
            displayed += title[i++];
            el.textContent = displayed + "_";
            el.style.opacity = String(rand(0.5, 0.85));
          } else {
            el.textContent = displayed;
            clearInterval(typeInterval);
            setTimeout(() => {
              el.style.opacity = "0";
              setTimeout(() => el.remove(), 300);
            }, rand(400, 900));
          }
        }, SPEED);
      }
    };

    const onMove = (e) => spawn(e.clientX, e.clientY);
    section.addEventListener("pointermove", onMove);
    return () => section.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, overflow: "hidden" }}
    />
  );
}
