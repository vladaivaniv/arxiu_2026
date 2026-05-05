import { useEffect, useRef } from "react";

const GLYPHS = "ARTIST       ".split("");
const CELL_SIZE = 9;
const TARGET_FPS = 18;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const MIN_ALPHA = 0.06;
const MAX_ALPHA = 0.55;

function noise(x, y) {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

export default function WebcamAscii() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    video.muted = true;

    let frameId = 0;
    let stream = null;
    let lastTime = 0;
    let prevW = 0;
    let prevH = 0;
    let isMounted = true;
    let isVisible = false;
    let isRequestingCamera = false;

    const sampleCanvas = document.createElement("canvas");
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });

    const bufferCanvas = document.createElement("canvas");
    const bufferCtx = bufferCanvas.getContext("2d");

    const staticGrid = [];

    const buildStaticGrid = (cols, rows) => {
      staticGrid.length = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const n = noise(col, row);
          staticGrid.push({
            baseChar: GLYPHS[Math.floor(n * GLYPHS.length) % GLYPHS.length],
            flicker: noise(col * 1.7 + 3, row * 2.3 + 7),
          });
        }
      }
    };

    let prevCols = 0;
    let prevRows = 0;

    const draw = (now) => {
      if (!isVisible) {
        frameId = 0;
        return;
      }

      frameId = requestAnimationFrame(draw);

      if (now - lastTime < FRAME_INTERVAL) return;
      lastTime = now;

      const rect = canvas.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      if (w !== prevW || h !== prevH) {
        canvas.width = w;
        canvas.height = h;
        bufferCanvas.width = w;
        bufferCanvas.height = h;
        prevW = w;
        prevH = h;
      }

      const cols = Math.floor(w / CELL_SIZE);
      const rows = Math.floor(h / (CELL_SIZE * 1.4));

      if (cols !== prevCols || rows !== prevRows) {
        buildStaticGrid(cols, rows);
        prevCols = cols;
        prevRows = rows;
      }

      const hasVideo = video.readyState >= 2;
      let data = null;

      if (hasVideo) {
        if (sampleCanvas.width !== cols) sampleCanvas.width = cols;
        if (sampleCanvas.height !== rows) sampleCanvas.height = rows;
        sampleCtx.drawImage(video, 0, 0, cols, rows);
        data = sampleCtx.getImageData(0, 0, cols, rows).data;
      }

      bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
      bufferCtx.fillStyle = "#000";
      bufferCtx.fillRect(0, 0, w, h);

      const fontSize = CELL_SIZE * 0.92;
      bufferCtx.font = `${fontSize}px "Space Mono",monospace`;
      bufferCtx.textAlign = "center";
      bufferCtx.textBaseline = "middle";

      const cellW = w / cols;
      const cellH = h / rows;
      const glyphCount = GLYPHS.length;
      const time = now * 0.001;

      for (let row = 0; row < rows; row++) {
        const y = row * cellH + cellH * 0.5;
        const rowOffset = row * cols;

        for (let col = 0; col < cols; col++) {
          const idx = rowOffset + col;
          const cell = staticGrid[idx];

          let brightness = 0;
          let char = cell.baseChar;

          if (data) {
            const i = idx * 4;
            brightness = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
            const normalized = brightness / 255;
            const glyphIndex = Math.floor(normalized * (glyphCount - 1));
            char = GLYPHS[glyphIndex];
          }

          const normalized = brightness / 255;
          const flicker = cell.flicker * 0.15;
          const alpha = hasVideo
            ? MIN_ALPHA + normalized * (MAX_ALPHA - MIN_ALPHA) + flicker * (0.04 + normalized * 0.08)
            : MIN_ALPHA + flicker * 0.06;

          bufferCtx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
          bufferCtx.fillText(char, col * cellW + cellW * 0.5, y);
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(bufferCanvas, 0, 0);
    };

    const startDrawLoop = () => {
      if (!frameId) {
        lastTime = 0;
        frameId = requestAnimationFrame(draw);
      }
    };

    const stopDrawLoop = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };

    const stopCamera = () => {
      video.pause();
      video.srcObject = null;

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
    };

    const startCamera = () => {
      if (stream || isRequestingCamera || !navigator.mediaDevices?.getUserMedia) {
        return;
      }

      isRequestingCamera = true;

      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user", width: 480, height: 360 }, audio: false })
        .then((mediaStream) => {
          isRequestingCamera = false;

          if (!isMounted || !isVisible) {
            mediaStream.getTracks().forEach((track) => track.stop());
            return;
          }

          stream = mediaStream;
          video.srcObject = mediaStream;
          video.play().catch(() => {});
        })
        .catch(() => {
          isRequestingCamera = false;
        });
    };

    const observer = new IntersectionObserver(

      ([entry]) => {
        isVisible = entry.isIntersecting;

        if (isVisible) {
          startCamera();
          startDrawLoop();
          return;
        }

        stopDrawLoop();
        stopCamera();
      },
      {
        threshold: 0.81, // Allows to start the camera  bit later when the component is more visible, and stop it sooner when it's less visible. ( So no performance is impacted while scrolling fast, but the camera starts quickly enough when the user scrolls slowly or stops on the section. )
        rootMargin: "12% 0px",
      },
    );

    observer.observe(canvas);

    return () => {
      isMounted = false;
      observer.disconnect();
      stopDrawLoop();
      stopCamera();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="webcam-ascii-canvas"
      aria-hidden="true"
    />
  );
}
