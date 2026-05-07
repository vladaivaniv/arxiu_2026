import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function interpolate(start, end, progress) {
  return start + (end - start) * progress;
}

function parseObjectPosition(objectPosition = "50% 50%") {
  const [rawX = "50%", rawY = "50%"] = objectPosition.split(" ");

  const resolveAxis = (value, fallback = 0.5) => {
    if (typeof value !== "string") {
      return fallback;
    }

    if (value.endsWith("%")) {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return clamp(parsed / 100, 0, 1);
      }
    }

    if (value === "left" || value === "top") {
      return 0;
    }

    if (value === "right" || value === "bottom") {
      return 1;
    }

    if (value === "center") {
      return 0.5;
    }

    return fallback;
  };

  return {
    x: resolveAxis(rawX, 0.5),
    y: resolveAxis(rawY, 0.5),
  };
}

function drawCoverFrame(context, source, targetWidth, targetHeight, objectPosition) {
  const sourceWidth = source.videoWidth || 0;
  const sourceHeight = source.videoHeight || 0;

  if (!sourceWidth || !sourceHeight) {
    return;
  }

  const { x, y } = parseObjectPosition(objectPosition);
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const offsetX = (targetWidth - drawWidth) * x;
  const offsetY = (targetHeight - drawHeight) * y;

  context.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
}

// density ramp: space=dark → @=bright
const ASCII_RAMP = " `.-':,;^~=+<>!?|()[]iIlrft1{}vjsxJTYCLnuczXVUOZ0QkmwqpdbhaoS#$%&@".split("");
const ASCII_CELL = 5;

const _asciiOff = document.createElement("canvas");
const _asciiOffCtx = _asciiOff.getContext("2d", { willReadFrequently: true });

function renderAsciiToCtx(ctx, video, width, height) {
  if (!video || video.readyState < 2) return;

  const cols = Math.floor(width / ASCII_CELL);
  const rows = Math.floor(height / (ASCII_CELL * 1.6));

  if (_asciiOff.width !== cols) _asciiOff.width = cols;
  if (_asciiOff.height !== rows) _asciiOff.height = rows;

  _asciiOffCtx.filter = "contrast(2.0) brightness(1.0) grayscale(1)";
  _asciiOffCtx.drawImage(video, 0, 0, cols, rows);
  _asciiOffCtx.filter = "none";
  const { data } = _asciiOffCtx.getImageData(0, 0, cols, rows);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#050608";
  ctx.fillRect(0, 0, width, height);

  ctx.font = `bold ${ASCII_CELL + 1}px "Space Mono", monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const cellW = width / cols;
  const cellH = height / rows;
  const last = ASCII_RAMP.length - 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = (row * cols + col) * 4;
      const raw = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      const b = Math.min(1, Math.max(0, (raw - 0.04) * 1.6));
      if (b < 0.08) continue;
      const char = ASCII_RAMP[Math.round(b * last)];
      if (b > 0.97) {
        ctx.fillStyle = `rgba(255,0,0,${(0.75 + b * 0.25).toFixed(2)})`;
      } else {
        ctx.fillStyle = `rgba(235,235,235,${(0.5 + b * 0.5).toFixed(2)})`;
      }
      ctx.fillText(char, col * cellW, row * cellH);
    }
  }
}

export default function ScrollGlitchMedia({ src, objectPosition, title }) {
  const mediaRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const halftoneRef = useRef(null);
  const noiseRef = useRef(null);
  const scanRef = useRef(null);
  const sliceTopRef = useRef(null);
  const sliceMiddleRef = useRef(null);
  const sliceBottomRef = useRef(null);
  const progressRef = useRef(0);
  const frameRef = useRef(0);
  const halftoneFrameRef = useRef(0);

  useEffect(() => {
    const media = mediaRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const halftone = halftoneRef.current;
    const noise = noiseRef.current;
    const scan = scanRef.current;
    const sliceTop = sliceTopRef.current;
    const sliceMiddle = sliceMiddleRef.current;
    const sliceBottom = sliceBottomRef.current;

    if (!media || !video || !canvas || !halftone || !noise || !scan || !sliceTop || !sliceMiddle || !sliceBottom) {
      return undefined;
    }

    const halftoneCtx = halftone.getContext("2d");

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canvasContext = canvas.getContext("2d");
    const pixelCanvas = document.createElement("canvas");
    const pixelContext = pixelCanvas.getContext("2d");

    // Offscreen buffer for ASCII — composited with erase mask at 60fps
    const asciiBuffer = document.createElement("canvas");
    const asciiCtx = asciiBuffer.getContext("2d");

    let animationContext;
    let visibilityObserver;
    let isVisible = false;

    if (!canvasContext || !pixelContext || !halftoneCtx || !asciiCtx) {
      return undefined;
    }

    canvasContext.imageSmoothingEnabled = false;
    pixelContext.imageSmoothingEnabled = false;

    // ── Erase state ──────────────────────────────────────────────
    let eraseTrail = [];
    let isHovered = false;
    let lastMX = 0;
    let lastMY = 0;
    let lastMoveTime = 0;

    const onMouseMove = (e) => {
      const rect = media.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dist = Math.hypot(x - lastMX, y - lastMY);
      if (dist > 10) {
        lastMX = x;
        lastMY = y;
        lastMoveTime = performance.now();
        eraseTrail.push({ x, y, r: 0, maxR: 140 + Math.random() * 60 });
        if (eraseTrail.length > 50) eraseTrail.shift();
      }
    };

    const onMouseEnter = () => {
      isHovered = true;
    };

    const onMouseLeave = () => {
      isHovered = false;
    };

    media.addEventListener("mousemove", onMouseMove);
    media.addEventListener("mouseenter", onMouseEnter);
    media.addEventListener("mouseleave", onMouseLeave);

    // ── Pixel entrance loop ──────────────────────────────────────
    const ensurePlayback = () => {
      if (!isVisible) return;
      video.play().catch(() => {});
    };

    const renderPixelFrame = () => {
      if (!isVisible) {
        frameRef.current = 0;
        return;
      }

      const rect = media.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      if (
        canvas.width !== Math.round(width * dpr) ||
        canvas.height !== Math.round(height * dpr)
      ) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      canvasContext.setTransform(1, 0, 0, 1, 0, 0);
      canvasContext.scale(dpr, dpr);
      canvasContext.clearRect(0, 0, width, height);

      if (video.readyState < 2) {
        frameRef.current = window.requestAnimationFrame(renderPixelFrame);
        return;
      }

      const easedProgress = mediaQuery.matches
        ? 1
        : easeOutCubic(clamp(progressRef.current, 0, 1));
      const pixelSize = mediaQuery.matches
        ? 1
        : Math.max(1, Math.round(interpolate(48, 2, easedProgress)));
      const pixelWidth = Math.max(1, Math.round(width / pixelSize));
      const pixelHeight = Math.max(1, Math.round(height / pixelSize));

      if (pixelCanvas.width !== pixelWidth || pixelCanvas.height !== pixelHeight) {
        pixelCanvas.width = pixelWidth;
        pixelCanvas.height = pixelHeight;
      }

      pixelContext.clearRect(0, 0, pixelWidth, pixelHeight);
      drawCoverFrame(pixelContext, video, pixelWidth, pixelHeight, objectPosition);
      canvasContext.drawImage(pixelCanvas, 0, 0, pixelWidth, pixelHeight, 0, 0, width, height);

      const gridAlpha = mediaQuery.matches ? 0 : (1 - easedProgress) * 0.16;
      if (gridAlpha > 0.002) {
        canvasContext.save();
        canvasContext.globalAlpha = gridAlpha;
        canvasContext.fillStyle = "rgba(255, 255, 255, 0.22)";
        const cellSize = Math.max(4, Math.round(pixelSize * 0.92));
        for (let column = 0; column < width; column += cellSize) {
          canvasContext.fillRect(column, 0, 1, height);
        }
        for (let row = 0; row < height; row += cellSize) {
          canvasContext.fillRect(0, row, width, 1);
        }
        canvasContext.restore();
      }

      frameRef.current = window.requestAnimationFrame(renderPixelFrame);
    };

    const startRenderLoop = () => {
      if (!frameRef.current) {
        frameRef.current = window.requestAnimationFrame(renderPixelFrame);
      }
    };

    const stopRenderLoop = () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };

    // ── ASCII + erase composite loop (60fps) ─────────────────────
    let asciiThrottle = 0;

    const renderHalftoneFrame = (now) => {
      halftoneFrameRef.current = window.requestAnimationFrame(renderHalftoneFrame);

      const rect = media.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));

      if (halftone.width !== w || halftone.height !== h) {
        halftone.width = w;
        halftone.height = h;
        asciiBuffer.width = w;
        asciiBuffer.height = h;
        asciiThrottle = 0;
      } else if (asciiBuffer.width !== w || asciiBuffer.height !== h) {
        asciiBuffer.width = w;
        asciiBuffer.height = h;
      }

      // Redraw ASCII buffer at ~12fps
      if (now - asciiThrottle >= 80) {
        asciiThrottle = now;
        renderAsciiToCtx(asciiCtx, video, w, h);
      }

      // Update erase trail radii
      // Heal when mouse stops moving for 2.2s — works whether hovered or not
      const timeSinceMove = now - lastMoveTime;
      const mouseActive = isHovered && timeSinceMove < 1200;
      const canHeal = timeSinceMove > 6000;

      eraseTrail = eraseTrail.filter((pt) => {
        if (mouseActive) {
          pt.r = Math.min(pt.maxR, pt.r + 7);
          return true;
        }
        if (canHeal) {
          pt.r = Math.max(0, pt.r - 0.45);
        }
        return pt.r > 0;
      });

      // Composite: ASCII buffer → halftone, then punch erase holes
      halftoneCtx.clearRect(0, 0, w, h);
      halftoneCtx.drawImage(asciiBuffer, 0, 0);

      if (eraseTrail.length > 0) {
        halftoneCtx.save();
        halftoneCtx.globalCompositeOperation = "destination-out";
        for (const pt of eraseTrail) {
          if (pt.r < 1) continue;
          const grad = halftoneCtx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.r);
          grad.addColorStop(0, "rgba(0,0,0,1)");
          grad.addColorStop(0.45, "rgba(0,0,0,0.95)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
          halftoneCtx.fillStyle = grad;
          halftoneCtx.beginPath();
          halftoneCtx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
          halftoneCtx.fill();
        }
        halftoneCtx.restore();
      }
    };

    const startHalftoneLoop = () => {
      if (!halftoneFrameRef.current) {
        halftoneFrameRef.current = window.requestAnimationFrame(renderHalftoneFrame);
      }
    };

    const stopHalftoneLoop = () => {
      if (halftoneFrameRef.current) {
        window.cancelAnimationFrame(halftoneFrameRef.current);
        halftoneFrameRef.current = 0;
      }
    };

    // ── GSAP scroll animation ─────────────────────────────────────
    const setupAnimation = () => {
      animationContext?.revert();
      progressRef.current = mediaQuery.matches ? 1 : 0;

      animationContext = gsap.context(() => {
        if (mediaQuery.matches) {
          gsap.set(media, { clearProps: "all" });
          gsap.set(video, { clearProps: "all", opacity: 1, scale: 1, filter: "none" });
          gsap.set(canvas, { opacity: 0 });
          gsap.set([noise, scan, sliceTop, sliceMiddle, sliceBottom], { opacity: 0 });
          return;
        }

        gsap.set(media, { clipPath: "inset(0% 0% 0% 0%)", y: 0, opacity: 1 });

        // Video visible from the start so erase holes reveal it
        gsap.set(video, {
          opacity: 1,
          scale: 1.02,
          filter: "saturate(0.9) contrast(1.06) brightness(0.88) hue-rotate(0deg)",
        });

        gsap.set(canvas, { opacity: 1 });

        gsap.set(noise, { opacity: 0.34, backgroundPosition: "0px 0px, 10px 14px" });
        gsap.set(scan, { opacity: 0.24, yPercent: -6 });
        gsap.set([sliceTop, sliceMiddle, sliceBottom], { opacity: 0, xPercent: 0 });

        gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: media,
            start: "top 92%",
            end: "top 28%",
            scrub: 0.42,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              progressRef.current = self.progress;
            },
          },
        })
          .to(media, { clipPath: "inset(0% 0% 0% 0%)", y: 0, opacity: 1, duration: 1 }, 0)
          .to(
            canvas,
            { opacity: 0, duration: 0.18 },
            0.82,
          )
          .to(
            noise,
            { opacity: 0.04, backgroundPosition: "26px 18px, -6px 24px", duration: 0.9 },
            0.12,
          )
          .to(scan, { opacity: 0.03, yPercent: 8, duration: 0.86 }, 0.16)
          .fromTo(
            sliceTop,
            { opacity: 0, xPercent: -6 },
            { opacity: 0.34, xPercent: 4, duration: 0.12 },
            0.18,
          )
          .to(sliceTop, { opacity: 0, xPercent: -2, duration: 0.1 }, 0.3)
          .fromTo(
            sliceMiddle,
            { opacity: 0, xPercent: 8 },
            { opacity: 0.42, xPercent: -5, duration: 0.14 },
            0.28,
          )
          .to(sliceMiddle, { opacity: 0, xPercent: 3, duration: 0.12 }, 0.42)
          .fromTo(
            sliceBottom,
            { opacity: 0, xPercent: -5 },
            { opacity: 0.28, xPercent: 6, duration: 0.11 },
            0.38,
          )
          .to(sliceBottom, { opacity: 0, xPercent: -1, duration: 0.1 }, 0.48);
      }, media);

      ScrollTrigger.refresh();
    };

    setupAnimation();

    visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;

        if (isVisible) {
          ensurePlayback();
          startRenderLoop();
          startHalftoneLoop();
          return;
        }

        video.pause();
        stopRenderLoop();
        stopHalftoneLoop();
      },
      { threshold: 0.01, rootMargin: "18% 0px" },
    );

    visibilityObserver.observe(media);

    const handleLoadedData = () => {
      ensurePlayback();
      ScrollTrigger.refresh();
    };

    const handleMotionChange = () => {
      setupAnimation();
    };

    video.addEventListener("loadeddata", handleLoadedData);
    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      animationContext?.revert();
      visibilityObserver?.disconnect();
      stopRenderLoop();
      stopHalftoneLoop();
      video.pause();
      video.removeEventListener("loadeddata", handleLoadedData);
      mediaQuery.removeEventListener("change", handleMotionChange);
      media.removeEventListener("mousemove", onMouseMove);
      media.removeEventListener("mouseenter", onMouseEnter);
      media.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [objectPosition, src]);

  return (
    <div ref={mediaRef} className="work-media">
      <video
        ref={videoRef}
        className="work-preview"
        src={src}
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={title}
        style={{ objectPosition }}
      />
      <canvas ref={canvasRef} className="work-pixel-canvas" aria-hidden="true" />
      <canvas ref={halftoneRef} className="work-halftone-canvas" aria-hidden="true" />
      <div ref={noiseRef} className="work-glitch-noise" aria-hidden="true" />
      <div ref={scanRef} className="work-glitch-scan" aria-hidden="true" />
      <div ref={sliceTopRef} className="work-glitch-slice slice-top" aria-hidden="true" />
      <div ref={sliceMiddleRef} className="work-glitch-slice slice-middle" aria-hidden="true" />
      <div ref={sliceBottomRef} className="work-glitch-slice slice-bottom" aria-hidden="true" />
    </div>
  );
}
