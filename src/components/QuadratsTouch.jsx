import { useEffect, useRef } from "react";

export default function QuadratsTouch() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let width = 0;
    let height = 0;
    let mx = -9999;
    let my = -9999;

    const squares = [];

    const buildSquares = () => {
      squares.length = 0;
      const count = 10;
      for (let i = 0; i < count; i += 1) {
        const size = 14 + Math.random() * 22;
        squares.push({
          x: Math.random() * (width - size),
          y: Math.random() * (height - size),
          size,
          state: "visible",
          stateAt: performance.now() - Math.random() * 1200,
          rotation: (Math.random() - 0.5) * 0.5,
        });
      }
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (squares.length === 0) buildSquares();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        mx = -9999;
        my = -9999;
        return;
      }
      const sx = canvas.clientWidth / rect.width;
      const sy = canvas.clientHeight / rect.height;
      mx = (e.clientX - rect.left) * sx;
      my = (e.clientY - rect.top) * sy;
    };

    document.addEventListener("mousemove", onMove);

    const FADE_OUT = 320;
    const HIDDEN_MIN = 1800;
    const HIDDEN_RANGE = 1800;
    const FADE_IN = 420;

    const tick = (now) => {
      ctx.clearRect(0, 0, width, height);

      for (const sq of squares) {
        const cx = sq.x + sq.size / 2;
        const cy = sq.y + sq.size / 2;
        const halfHit = sq.size * 0.6;
        const within =
          mx >= cx - halfHit &&
          mx <= cx + halfHit &&
          my >= cy - halfHit &&
          my <= cy + halfHit;

        if (sq.state === "visible" && within) {
          sq.state = "fading-out";
          sq.stateAt = now;
        } else if (sq.state === "hidden") {
          const hiddenFor = now - sq.stateAt;
          if (hiddenFor >= HIDDEN_MIN + sq.hiddenDuration) {
            sq.state = "fading-in";
            sq.stateAt = now;
            sq.x = Math.random() * (width - sq.size);
            sq.y = Math.random() * (height - sq.size);
            sq.rotation = (Math.random() - 0.5) * 0.5;
          }
        }

        let alpha = 1;
        if (sq.state === "fading-out") {
          const t = (now - sq.stateAt) / FADE_OUT;
          if (t >= 1) {
            sq.state = "hidden";
            sq.stateAt = now;
            sq.hiddenDuration = Math.random() * HIDDEN_RANGE;
            alpha = 0;
          } else {
            alpha = 1 - t;
          }
        } else if (sq.state === "fading-in") {
          const t = (now - sq.stateAt) / FADE_IN;
          if (t >= 1) {
            sq.state = "visible";
            sq.stateAt = now;
            alpha = 1;
          } else {
            alpha = t;
          }
        } else if (sq.state === "hidden") {
          alpha = 0;
        }

        if (alpha <= 0.005) continue;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(sq.rotation);
        ctx.strokeStyle = `rgba(255, 0, 0, ${(alpha * 0.85).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.fillStyle = `rgba(255, 0, 0, ${(alpha * 0.12).toFixed(3)})`;
        ctx.beginPath();
        ctx.rect(-sq.size / 2, -sq.size / 2, sq.size, sq.size);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="quadrats-touch-canvas" aria-hidden="true" />;
}
