import { useEffect, useRef } from "react";

const CELL   = 14;
const GLYPHS = "█▓▒░10ART#%+=-:.";
const C_BLACK  = "#000000";
const C_RED    = "#3d0000";
const C_BRIGHT = "#FF0000";

function hash(c, r, s = 0) {
  const v = Math.sin((c + 1.93) * 127.1 + (r + 8.37) * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

function smoothstep(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function getScrollX() {
  const track = document.querySelector(".horizontal-track");
  if (!track) return 0;
  return -new DOMMatrix(getComputedStyle(track).transform).m41;
}

export default function SectionFadeTransition() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let frameId = 0;
    let smoothT = 0;
    let time    = 0;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (ts) => {
      frameId = requestAnimationFrame(tick);
      time = ts;

      const archive = document.querySelector(".archive-intro-section");
      if (!archive) return;

      const scrollX     = getScrollX();
      const sectionLeft = archive.offsetLeft;
      const vw          = window.innerWidth;

      const raw    = (scrollX - (sectionLeft - vw)) / vw;
      const target = smoothstep(Math.max(0, Math.min(1, raw)));
      smoothT += (target - smoothT) * 0.07;

      const W = canvas.width;
      const H = canvas.height;
      const cols = Math.ceil(W / CELL);
      const rows = Math.ceil(H / CELL);

      // base background interpolated
      const ri = Math.round(smoothT * 0x3d);
      ctx.fillStyle = `rgb(${ri},0,0)`;
      ctx.fillRect(0, 0, W, H);

      if (smoothT < 0.02 || smoothT > 0.98) return;

      // ASCII glitch wipe — cells reveal from left to right
      ctx.font = `bold ${CELL - 2}px "Space Mono", monospace`;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const n = hash(c, r, 1);
          // staggered reveal threshold per column + noise
          const colT = smoothstep(smoothT * 2 - (c / cols) * 0.8 - n * 0.3);
          if (colT < 0.05) continue;

          const glyphN = hash(c, r, Math.floor(ts * 0.003));
          const gi     = Math.floor(glyphN * GLYPHS.length);

          // choose brightness by cell heat
          const bright = hash(c, r, 3 + Math.floor(smoothT * 12));
          if (bright > colT + 0.1) continue;

          const isBright = colT > 0.6 && bright > 0.7;
          ctx.fillStyle  = isBright ? C_BRIGHT : (colT > 0.5 ? "#6b0000" : "#2a0000");
          ctx.globalAlpha = Math.min(1, colT * 1.4);
          ctx.fillText(GLYPHS[gi], c * CELL + CELL / 2, r * CELL + CELL / 2);
        }
      }

      ctx.globalAlpha = 1;
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}
