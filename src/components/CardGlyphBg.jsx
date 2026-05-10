import { useEffect, useRef } from "react";

const GLYPHS = "ART#%+=:*/\\|[]{}()<>_-~^01XZQW@$&!?;,.°§█▓▒░│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌▄▌▐▀■▪▫▬↑↓→←↕↨▲▶►◄▼◘○◙♦♣♠♥·•";

function rand(a, b) { return a + Math.random() * (b - a); }

export default function CardGlyphBg() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let running = true;
    const timers = [];

    // ── fons ambient aleatori ──────────────────────────
    const spawnAmbient = () => {
      if (!running) return;
      const el = document.createElement("span");
      el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      el.style.cssText = `
        position: absolute;
        left: ${rand(1, 98)}%;
        top: ${rand(1, 97)}%;
        font-family: 'Space Mono', monospace;
        font-size: ${rand(8, 16)}px;
        color: rgba(180,0,0,${rand(0.06, 0.25).toFixed(2)});
        opacity: 0;
        pointer-events: none;
        white-space: nowrap;
        transition: opacity ${rand(0.2, 0.5).toFixed(2)}s ease;
        z-index: 0;
      `;
      container.appendChild(el);
      const t1 = setTimeout(() => {
        el.style.opacity = "1";
        const t2 = setTimeout(() => {
          el.style.opacity = "0";
          const t3 = setTimeout(() => el.remove(), 500);
          timers.push(t3);
        }, rand(300, 1200));
        timers.push(t2);
      }, Math.random() * 80);
      timers.push(t1);
    };

    const spawnBatch = () => {
      if (!running) return;
      const count = Math.floor(rand(8, 16));
      for (let i = 0; i < count; i++) {
        const t = setTimeout(spawnAmbient, i * rand(40, 120));
        timers.push(t);
      }
      const t = setTimeout(spawnBatch, rand(300, 700));
      timers.push(t);
    };

    spawnBatch();

    // ── efecte ratolí ──────────────────────────────────
    const spawnAtMouse = (x, y) => {
      if (!running) return;
      const count = Math.floor(rand(1, 3));
      for (let i = 0; i < count; i++) {
        const el = document.createElement("span");
        el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const offsetX = rand(-25, 25);
        const offsetY = rand(-15, 15);
        el.style.cssText = `
          position: absolute;
          left: ${x + offsetX}px;
          top: ${y + offsetY}px;
          font-family: 'Space Mono', monospace;
          font-size: ${rand(7, 11)}px;
          color: rgba(255,0,0,${rand(0.06, 0.18).toFixed(2)});
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          transition: opacity 0.2s ease, transform 0.5s ease;
          transform: translate(0, 0);
          z-index: 1;
        `;
        container.appendChild(el);
        requestAnimationFrame(() => {
          el.style.opacity = "1";
          el.style.transform = `translate(${rand(-20, 20)}px, ${rand(-15, -30)}px)`;
        });
        const t = setTimeout(() => {
          el.style.opacity = "0";
          setTimeout(() => el.remove(), 400);
        }, rand(200, 600));
        timers.push(t);
      }
    };

    let lastMove = 0;
    const onMouseMove = (e) => {
      const now = performance.now();
      if (now - lastMove < 60) return;
      lastMove = now;
      const rect = container.getBoundingClientRect();
      spawnAtMouse(e.clientX - rect.left, e.clientY - rect.top);
    };

    const card = container.closest(".work-card");
    if (card) {
      card.addEventListener("mousemove", onMouseMove);
    }

    return () => {
      running = false;
      timers.forEach(clearTimeout);
      container.querySelectorAll("span").forEach(el => el.remove());
      if (card) card.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    />
  );
}
