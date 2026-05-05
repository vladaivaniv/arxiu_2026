import { useEffect, useRef } from "react";

const CELL_SIZE = 18;
const FRAME_INTERVAL = 1000 / 30;
const DPR_LIMIT = 2;

const BLACK = "#000000";
const RED = "#ff2a2a";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value) {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function hash(col, row, salt = 0) {
  const value =
    Math.sin((col + 1.93) * 127.1 + (row + 8.37) * 311.7 + salt * 74.7) *
    43758.5453;

  return value - Math.floor(value);
}

function getBoundaryProgress(boundaryElement) {
  const rect = boundaryElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  /*
    rect.left = posición exacta donde se tocan HeroSection y ArchiveIntroSection.

    Cuando la línea está en el borde derecho de pantalla => progress 0.
    Cuando la línea llega al centro => progress 0.5.
    Cuando la línea sale por el borde izquierdo => progress 1.
  */

  return clamp((viewportWidth - rect.left) / viewportWidth, 0, 1);
}

export default function PixelSectionTransition() {
  const boundaryRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    const boundary = boundaryRef.current;
    const canvas = canvasRef.current;

    if (!boundary || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);

      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);

      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(timestamp) {
      animationRef.current = requestAnimationFrame(draw);

      if (timestamp - lastFrameRef.current < FRAME_INTERVAL) return;
      lastFrameRef.current = timestamp;

      const width = window.innerWidth;
      const height = window.innerHeight;

      const progress = getBoundaryProgress(boundary);
      const intensity = smoothstep(progress);

      ctx.clearRect(0, 0, width, height);

      /*
        Fuera de la zona de transición no dibujamos nada.
        Así no tapa secciones cuando no hace falta.
      */
      if (progress <= 0.01 || progress >= 0.99) return;

      const cols = Math.ceil(width / CELL_SIZE);
      const rows = Math.ceil(height / CELL_SIZE);

      const centerX = width / 2;

      /*
        Zona activa alrededor del punto donde se tocan las secciones.
        Cuanto más avanza el scroll, más ancho y más agresivo es el glitch.
      */
      const maxBandWidth = width * 0.75;
      const bandWidth = maxBandWidth * Math.sin(progress * Math.PI);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * CELL_SIZE;
          const y = row * CELL_SIZE;

          const cellCenterX = x + CELL_SIZE / 2;
          const distanceFromCenter = Math.abs(cellCenterX - centerX);

          const insideBand = distanceFromCenter < bandWidth / 2;

          if (!insideBand) continue;

          const localDistance = distanceFromCenter / (bandWidth / 2);
          const edgeFade = 1 - smoothstep(localDistance);

          const noiseA = hash(col, row, 1);
          const noiseB = hash(col, row, Math.floor(progress * 20));

          const revealThreshold = intensity * edgeFade;

          if (noiseA > revealThreshold + 0.25) continue;

          const sizeVariation = 0.65 + noiseB * 0.7;
          const pixelSize = CELL_SIZE * sizeVariation;

          const offsetX = (CELL_SIZE - pixelSize) / 2;
          const offsetY = (CELL_SIZE - pixelSize) / 2;

          const colorMix = hash(col, row, 7 + Math.floor(progress * 10));

          ctx.fillStyle = colorMix > progress ? BLACK : RED;

          ctx.globalAlpha = clamp(edgeFade * 1.15, 0, 1);

          ctx.fillRect(
            x + offsetX,
            y + offsetY,
            pixelSize,
            pixelSize,
          );
        }
      }

      ctx.globalAlpha = 1;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resizeCanvas);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={boundaryRef}
      className="pixel-section-boundary"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="pixel-section-canvas" />
    </div>
  );
}