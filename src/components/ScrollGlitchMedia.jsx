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

export default function ScrollGlitchMedia({ src, objectPosition, title }) {
  const mediaRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const noiseRef = useRef(null);
  const scanRef = useRef(null);
  const sliceTopRef = useRef(null);
  const sliceMiddleRef = useRef(null);
  const sliceBottomRef = useRef(null);
  const progressRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const media = mediaRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const noise = noiseRef.current;
    const scan = scanRef.current;
    const sliceTop = sliceTopRef.current;
    const sliceMiddle = sliceMiddleRef.current;
    const sliceBottom = sliceBottomRef.current;

    if (!media || !video || !canvas || !noise || !scan || !sliceTop || !sliceMiddle || !sliceBottom) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canvasContext = canvas.getContext("2d");
    const pixelCanvas = document.createElement("canvas");
    const pixelContext = pixelCanvas.getContext("2d");
    let animationContext;

    if (!canvasContext || !pixelContext) {
      return undefined;
    }

    canvasContext.imageSmoothingEnabled = false;
    pixelContext.imageSmoothingEnabled = false;

    const ensurePlayback = () => {
      video.play().catch(() => {});
    };

    const renderPixelFrame = () => {
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

    const setupAnimation = () => {
      animationContext?.revert();
      progressRef.current = mediaQuery.matches ? 1 : 0;

      animationContext = gsap.context(() => {
        if (mediaQuery.matches) {
          gsap.set(media, { clearProps: "all" });
          gsap.set(video, {
            clearProps: "all",
            opacity: 1,
            scale: 1,
            filter: "none",
          });
          gsap.set(canvas, { opacity: 0 });
          gsap.set([noise, scan, sliceTop, sliceMiddle, sliceBottom], { opacity: 0 });
          return;
        }

        gsap.set(media, {
          clipPath: "inset(12% 8% 10% 6%)",
          y: 42,
          opacity: 0.52,
        });

        gsap.set(video, {
          opacity: 0.4,
          scale: 1.05,
          filter: "saturate(0.72) contrast(1.08) brightness(0.76) hue-rotate(-6deg)",
        });

        gsap.set(canvas, {
          opacity: 1,
        });

        gsap.set(noise, {
          opacity: 0.34,
          backgroundPosition: "0px 0px, 10px 14px",
        });

        gsap.set(scan, {
          opacity: 0.24,
          yPercent: -6,
        });

        gsap.set([sliceTop, sliceMiddle, sliceBottom], {
          opacity: 0,
          xPercent: 0,
        });

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
          .to(
            media,
            {
              clipPath: "inset(0% 0% 0% 0%)",
              y: 0,
              opacity: 1,
              duration: 1,
            },
            0,
          )
          .to(
            video,
            {
              opacity: 1,
              scale: 1.02,
              filter: "saturate(0.9) contrast(1.06) brightness(0.88) hue-rotate(0deg)",
              duration: 1,
            },
            0,
          )
          .to(
            canvas,
            {
              opacity: 0,
              duration: 0.18,
            },
            0.82,
          )
          .to(
            noise,
            {
              opacity: 0.04,
              backgroundPosition: "26px 18px, -6px 24px",
              duration: 0.9,
            },
            0.12,
          )
          .to(
            scan,
            {
              opacity: 0.03,
              yPercent: 8,
              duration: 0.86,
            },
            0.16,
          )
          .fromTo(
            sliceTop,
            {
              opacity: 0,
              xPercent: -6,
            },
            {
              opacity: 0.34,
              xPercent: 4,
              duration: 0.12,
            },
            0.18,
          )
          .to(
            sliceTop,
            {
              opacity: 0,
              xPercent: -2,
              duration: 0.1,
            },
            0.3,
          )
          .fromTo(
            sliceMiddle,
            {
              opacity: 0,
              xPercent: 8,
            },
            {
              opacity: 0.42,
              xPercent: -5,
              duration: 0.14,
            },
            0.28,
          )
          .to(
            sliceMiddle,
            {
              opacity: 0,
              xPercent: 3,
              duration: 0.12,
            },
            0.42,
          )
          .fromTo(
            sliceBottom,
            {
              opacity: 0,
              xPercent: -5,
            },
            {
              opacity: 0.28,
              xPercent: 6,
              duration: 0.11,
            },
            0.38,
          )
          .to(
            sliceBottom,
            {
              opacity: 0,
              xPercent: -1,
              duration: 0.1,
            },
            0.48,
          );
      }, media);

      ScrollTrigger.refresh();
    };

    ensurePlayback();
    setupAnimation();
    frameRef.current = window.requestAnimationFrame(renderPixelFrame);

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
      window.cancelAnimationFrame(frameRef.current);
      video.removeEventListener("loadeddata", handleLoadedData);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, [objectPosition, src]);

  return (
    <div ref={mediaRef} className="work-media">
      <video
        ref={videoRef}
        className="work-preview"
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={title}
        style={{ objectPosition }}
      />
      <canvas ref={canvasRef} className="work-pixel-canvas" aria-hidden="true" />
      <div ref={noiseRef} className="work-glitch-noise" aria-hidden="true" />
      <div ref={scanRef} className="work-glitch-scan" aria-hidden="true" />
      <div ref={sliceTopRef} className="work-glitch-slice slice-top" aria-hidden="true" />
      <div
        ref={sliceMiddleRef}
        className="work-glitch-slice slice-middle"
        aria-hidden="true"
      />
      <div
        ref={sliceBottomRef}
        className="work-glitch-slice slice-bottom"
        aria-hidden="true"
      />
    </div>
  );
}
