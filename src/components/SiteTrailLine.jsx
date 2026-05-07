import { useEffect, useRef } from "react";

const COLOR  = "#FF0000";
// ASCII-style: tight dash + big gap = dotted digital feel
const DASH   = [4, 11];

function getScrollX() {
  const track = document.querySelector(".horizontal-track");
  if (!track) return 0;
  return -new DOMMatrix(getComputedStyle(track).transform).m41;
}

function getTotalScroll() {
  const track = document.querySelector(".horizontal-track");
  if (!track) return 1;
  return Math.max(1, track.scrollWidth - window.innerWidth);
}

// Irregular organic control points in world space
function buildWorldPoints(totalW, H, seed) {
  const pts = [];
  const count = 22;
  let rng = seed;
  const rand = () => { rng = (rng * 16807 + 0) % 2147483647; return (rng - 1) / 2147483646; };

  for (let i = 0; i <= count; i++) {
    const t  = i / count;
    const wx = t * totalW;
    // irregular: mix of slow waves + noise
    const base  = Math.sin(t * Math.PI * 3.7 + 0.4) * H * 0.28;
    const noise = (rand() - 0.5) * H * 0.18;
    const spike = Math.sin(t * Math.PI * 9.1) * H * 0.08;
    const wy    = H * 0.5 + base + noise + spike;
    pts.push({ wx, wy: Math.max(H * 0.08, Math.min(H * 0.92, wy)) });
  }
  return pts;
}

export default function SiteTrailLine() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let pts = [];
    let frameId = 0;
    let dashOffset = 0;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const track = document.querySelector(".horizontal-track");
      const W = track ? track.scrollWidth : window.innerWidth * 6;
      pts = buildWorldPoints(W, window.innerHeight, 31337);
    };

    let smoothProgress = 0;
    let smoothScrollX  = 0;

    const draw = () => {
      frameId = requestAnimationFrame(draw);
      if (pts.length < 2) return;

      const W        = canvas.width;
      const H        = canvas.height;
      const scrollX  = getScrollX();
      const total    = getTotalScroll();
      const rawProgress = Math.min(1, scrollX / total);

      // smooth lerp toward real values
      smoothProgress += (rawProgress - smoothProgress) * 0.06;
      smoothScrollX  += (scrollX     - smoothScrollX)  * 0.06;

      const progress = smoothProgress;

      ctx.clearRect(0, 0, W, H);
      dashOffset -= 0.25;

      // exact fractional position along pts array
      const exactIdx   = progress * (pts.length - 1);
      const revealIdx  = Math.floor(exactIdx);
      const frac       = exactIdx - revealIdx; // 0..1 between two pts

      // interpolated tip point
      const tipA = pts[revealIdx];
      const tipB = pts[Math.min(revealIdx + 1, pts.length - 1)];
      const tip  = {
        wx: tipA.wx + (tipB.wx - tipA.wx) * frac,
        wy: tipA.wy + (tipB.wy - tipA.wy) * frac,
      };

      const sx = smoothScrollX;

      // ── 1. Already-drawn part (solid) ─────────────────────────────────
      if (progress > 0.005) {
        const revealed = [...pts.slice(0, revealIdx + 1), tip];

        ctx.save();
        ctx.strokeStyle = COLOR;
        ctx.lineWidth   = 1.5;
        ctx.globalAlpha = 0.7;
        ctx.setLineDash([]);
        ctx.lineJoin = "round";
        ctx.lineCap  = "round";

        ctx.beginPath();
        ctx.moveTo(revealed[0].wx - sx, revealed[0].wy);
        for (let i = 1; i < revealed.length - 1; i++) {
          const mx = ((revealed[i].wx + revealed[i + 1].wx) / 2) - sx;
          const my  = (revealed[i].wy + revealed[i + 1].wy) / 2;
          ctx.quadraticCurveTo(revealed[i].wx - sx, revealed[i].wy, mx, my);
        }
        const last = revealed[revealed.length - 1];
        ctx.lineTo(last.wx - sx, last.wy);
        ctx.stroke();
        ctx.restore();
      }

      // ── 2. Ahead part (dashed, faint) ─────────────────────────────────
      const ahead = [tip, ...pts.slice(revealIdx + 1)];
      if (ahead.length >= 2) {
        ctx.save();
        ctx.strokeStyle = COLOR;
        ctx.lineWidth   = 1;
        ctx.globalAlpha = 0.2;
        ctx.setLineDash(DASH);
        ctx.lineDashOffset = dashOffset;
        ctx.lineJoin = "round";
        ctx.lineCap  = "round";

        ctx.beginPath();
        ctx.moveTo(ahead[0].wx - sx, ahead[0].wy);
        for (let i = 1; i < ahead.length - 1; i++) {
          const mx = ((ahead[i].wx + ahead[i + 1].wx) / 2) - sx;
          const my  = (ahead[i].wy + ahead[i + 1].wy) / 2;
          ctx.quadraticCurveTo(ahead[i].wx - sx, ahead[i].wy, mx, my);
        }
        const last2 = ahead[ahead.length - 1];
        ctx.lineTo(last2.wx - sx, last2.wy);
        ctx.stroke();
        ctx.restore();
      }

      // ── 3. Dot at tip ─────────────────────────────────────────────────
      if (progress > 0.005) {
        ctx.save();
        ctx.fillStyle   = COLOR;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(tip.wx - sx, tip.wy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const init = () => {
      const track = document.querySelector(".horizontal-track");
      if (!track) { setTimeout(init, 100); return; }
      resize();
      new ResizeObserver(resize).observe(track);
      window.addEventListener("resize", resize);
      frameId = requestAnimationFrame(draw);
    };

    init();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 5 }}
      aria-hidden="true"
    />
  );
}
