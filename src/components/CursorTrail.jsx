import { useEffect, useRef } from "react";

const MAX_POINTS = 600;
const LINE_WIDTH = 1.5;
const DASH       = [6, 8];
const COLOR      = "#FF0000";

function getScrollX() {
  const track = document.querySelector(".horizontal-track");
  if (!track) return 0;
  const mat = new DOMMatrix(getComputedStyle(track).transform);
  return -mat.m41; // translateX (positive = scrolled right)
}

export default function CursorTrail() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    // each point stored in world coordinates
    const points = []; // { wx, wy }
    let frameId = 0;
    let dashOffset = 0;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => {
      const wx = e.clientX + getScrollX();
      const wy = e.clientY;
      // avoid duplicate points
      const last = points[points.length - 1];
      if (last && Math.hypot(wx - last.wx, wy - last.wy) < 3) return;
      points.push({ wx, wy });
      if (points.length > MAX_POINTS) points.shift();
    };
    window.addEventListener("pointermove", onMove);

    const draw = () => {
      frameId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (points.length < 2) return;

      const scrollX = getScrollX();
      dashOffset -= 0.4; // animate dash crawl forward

      ctx.save();
      ctx.strokeStyle = COLOR;
      ctx.lineWidth   = LINE_WIDTH;
      ctx.setLineDash(DASH);
      ctx.lineDashOffset = dashOffset;
      ctx.globalAlpha = 0.7;
      ctx.lineJoin = "round";
      ctx.lineCap  = "round";

      ctx.beginPath();
      // convert world → screen for first point
      ctx.moveTo(points[0].wx - scrollX, points[0].wy);

      for (let i = 1; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const mx = ((curr.wx + next.wx) / 2) - scrollX;
        const my  = (curr.wy + next.wy) / 2;
        ctx.quadraticCurveTo(curr.wx - scrollX, curr.wy, mx, my);
      }

      const last = points[points.length - 1];
      ctx.lineTo(last.wx - scrollX, last.wy);

      ctx.stroke();
      ctx.restore();
    };

    frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99998,
      }}
      aria-hidden="true"
    />
  );
}
