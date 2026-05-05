import { useEffect, useRef } from "react";

const CELL_SIZE = 22;
const FRAME_INTERVAL = 1000 / 24;
const BLACK = "#000000";
const RED = "#ff2a2a";

function hash(col, row, salt = 0) {
  const value = Math.sin((col + 1.93) * 127.1 + (row + 8.37) * 311.7 + salt * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

export default function PixelCreationTransition() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let frameId = 0;
    let lastTime = 0;
    let prevW = 0;
    let prevH = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

      if (width === prevW && height === prevH && nextDpr === dpr) {
        return;
      }

      prevW = width;
      prevH = height;
      dpr = nextDpr;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now) => {
      frameId = requestAnimationFrame(draw);

      if (now - lastTime < FRAME_INTERVAL) {
        return;
      }

      lastTime = now;
      resize();

      const progress = Number.parseFloat(
        getComputedStyle(canvas).getPropertyValue("--hero-project-transition"),
      );

      if (!Number.isFinite(progress) || progress <= 0.01 || progress >= 0.99) {
        ctx.clearRect(0, 0, prevW, prevH);
        return;
      }

      ctx.clearRect(0, 0, prevW, prevH);

      const easedProgress = smoothstep(progress);
      const cols = Math.ceil(prevW / CELL_SIZE) + 3;
      const rows = Math.ceil(prevH / CELL_SIZE);
      const revealEdgeX = prevW * (1 - easedProgress);
      const chaosWidth = prevW * 0.16;
      const parallaxShift = progress * CELL_SIZE * 3;
      const wave = now * 0.0012;
      const revealWidth = prevW - revealEdgeX;

      if (revealWidth <= 1) {
        return;
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(revealEdgeX, 0, revealWidth, prevH);
      ctx.clip();

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const rowDrift = (hash(0, row, 21) - 0.5) * parallaxShift;
          const layerDrift = hash(col, row, 22) * parallaxShift * 0.7;
          const x = col * CELL_SIZE - parallaxShift + rowDrift + layerDrift;
          const y = row * CELL_SIZE;
          const random = hash(col, row);
          const distance = Math.abs(x - revealEdgeX);
          const band = clamp(1 - distance / chaosWidth, 0, 1);

          if (x < revealEdgeX || band <= 0.03 || distance > chaosWidth) {
            continue;
          }

          const flicker = 0.82 + hash(col, row, Math.floor(wave * 10)) * 0.28;
          const edgeFade = Math.sin(progress * Math.PI);
          const density = clamp((band ** 1.45) * edgeFade * flicker, 0, 1);
          const threshold = 0.2 + density * 0.74;

          if (random > threshold) {
            continue;
          }

          const isLongBlock = hash(col, row, 5) > 0.72;
          const widthInCells = isLongBlock ? 2 + Math.floor(hash(col, row, 6) * 4) : 1;
          const width = Math.min(prevW - x, CELL_SIZE * widthInCells);
          const height = Math.max(3, Math.floor(CELL_SIZE * (0.58 + hash(col, row, 7) * 0.54)));
          const offsetY = Math.floor((CELL_SIZE - height) * hash(col, row, 8));

          if (width <= 0 || x >= prevW) {
            continue;
          }

          ctx.fillStyle = hash(col, row, 9) > 0.78 ? BLACK : RED;
          ctx.fillRect(x, y + offsetY, width, height);

          if (band > 0.78 && hash(col, row, 12) > 0.62) {
            ctx.fillStyle = hash(col, row, 13) > 0.5 ? BLACK : RED;
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
          }
        }
      }

      ctx.restore();
    };

    frameId = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pixel-creation-transition"
      aria-hidden="true"
    />
  );
}
