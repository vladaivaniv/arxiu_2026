import { useEffect, useRef } from "react";

const CHARS = ' .`\',:;-~+=<>i!lI?/|)(1tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

export default function AsciiImageOverlay({ src, cols = 120, rows = 50, opacity = 0.35, color = "#FF0000" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // sample image at low res
      const tmp = document.createElement("canvas");
      tmp.width = cols; tmp.height = rows;
      const tc = tmp.getContext("2d");
      tc.drawImage(img, 0, 0, cols, rows);
      const { data } = tc.getImageData(0, 0, cols, rows);

      ctx.clearRect(0, 0, w, h);
      const cw = w / cols;
      const ch = h / rows;
      const fs = Math.max(cw * 1.05, 1);
      ctx.font = `${fs}px "Space Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const idx = (j * cols + i) * 4;
          const br = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255;
          const ci = Math.round(br * (CHARS.length - 1));
          const ch2 = CHARS[ci];
          if (ch2 === " ") continue;
          ctx.globalAlpha = opacity * (0.4 + br * 0.6);
          ctx.fillStyle = color;
          ctx.fillText(ch2, i * cw + cw / 2, j * ch + ch / 2);
        }
      }
      ctx.globalAlpha = 1;
    };
    img.src = src;
  }, [src, cols, rows, opacity, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
