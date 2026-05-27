import { useEffect, useRef } from "react";
import morusAudioSrc from "../../assets/projectes_art_digital/MORUS ALBA/morus_alba_audio.mp3";

export default function BarkSound() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    let raf = 0;
    let width = 0;
    let height = 0;

    // Audio controlled by cursor activity inside the project area
    const audio = new Audio(morusAudioSrc);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;

    let audioStarted = false;
    let targetVolume = 0;
    const FADE_STEP = 0.04;
    const MAX_VOLUME = 0.65;
    let idleFrames = 0;
    const IDLE_LIMIT = 22; // ~360ms with 60fps

    const tryPlay = () => {
      if (audioStarted) return;
      audio
        .play()
        .then(() => {
          audioStarted = true;
        })
        .catch(() => {
          // autoplay may be blocked; will retry next gesture
          audioStarted = false;
        });
    };

    // Small MIDI-like cells that appear at cursor positions and fade
    const cells = [];
    let lastX = -1;
    let lastY = -1;
    let accumDist = 0;

    const allocate = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    allocate();
    const ro = new ResizeObserver(allocate);
    ro.observe(canvas);

    const rand = (a, b) => a + Math.random() * (b - a);

    // Build a small "barcode" pattern: vertical black bars of varying widths and heights
    // on a light background — directly inspired by the MORUS ALBA printed cards.
    const buildBars = (w, h) => {
      const bars = [];
      let x = 0;
      while (x < w) {
        const isFilled = Math.random() < 0.5;
        const barW = Math.max(1, Math.round(rand(1, w * 0.18)));
        if (isFilled) {
          // bar height: full or partial (top-aligned or bottom-aligned)
          const variant = Math.random();
          let by = 0;
          let bh = h;
          if (variant < 0.45) {
            bh = h * rand(0.45, 1);
            by = Math.random() < 0.5 ? 0 : h - bh;
          }
          bars.push({ x, y: by, w: barW, h: bh });
        }
        x += barW;
      }
      return bars;
    };

    const spawnCell = (x, y, isClick = false) => {
      const w = isClick ? rand(46, 70) : rand(26, 42);
      const h = isClick ? rand(22, 36) : rand(14, 22);
      const bars = buildBars(w, h);
      cells.push({
        x: x + rand(-3, 3),
        y: y + rand(-3, 3),
        w,
        h,
        bars,
        rotation: rand(-0.14, 0.14),
        age: 0,
        revealDuration: 6,
        life: 70 + Math.floor(rand(0, 30)),
      });
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) {
        lastX = -1;
        lastY = -1;
        accumDist = 0;
        targetVolume = 0;
        return;
      }
      // movement inside → trigger sound + spawn cells
      idleFrames = 0;
      tryPlay();
      targetVolume = MAX_VOLUME;

      const px = (e.clientX - rect.left) * (width / rect.width);
      const py = (e.clientY - rect.top) * (height / rect.height);
      if (lastX >= 0) {
        accumDist += Math.hypot(px - lastX, py - lastY);
        if (accumDist > 38) {
          spawnCell(px, py);
          accumDist = 0;
        }
      } else {
        spawnCell(px, py);
      }
      lastX = px;
      lastY = py;
    };

    const onLeave = () => {
      lastX = -1;
      lastY = -1;
      accumDist = 0;
      targetVolume = 0;
    };

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }
      const px = (e.clientX - rect.left) * (width / rect.width);
      const py = (e.clientY - rect.top) * (height / rect.height);
      // click unlocks audio (covers autoplay block) and emits a small chord of cells
      tryPlay();
      targetVolume = MAX_VOLUME;
      idleFrames = 0;
      for (let i = 0; i < 5; i += 1) {
        spawnCell(px + rand(-12, 12), py + rand(-12, 12), true);
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("click", onClick);

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // audio idle fade-out if no movement for a while
      idleFrames += 1;
      if (idleFrames > IDLE_LIMIT && targetVolume > 0) {
        targetVolume = 0;
      }
      // fade volume toward target
      if (audio.volume < targetVolume) {
        audio.volume = Math.min(targetVolume, audio.volume + FADE_STEP);
      } else if (audio.volume > targetVolume) {
        audio.volume = Math.max(targetVolume, audio.volume - FADE_STEP);
      }
      if (audio.volume <= 0.001 && audioStarted) {
        audio.pause();
        audioStarted = false;
      }

      // draw barcode-style cards
      for (let i = cells.length - 1; i >= 0; i -= 1) {
        const c = cells[i];
        c.age += 1;

        const fadeIn = Math.min(1, c.age / 4);
        const fadeStart = c.life - 22;
        let alpha = 1;
        if (c.age > fadeStart) {
          alpha = Math.max(0, 1 - (c.age - fadeStart) / 22);
        }
        alpha *= fadeIn;

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);

        const halfW = c.w / 2;
        const halfH = c.h / 2;

        // white/light background card with subtle shadow
        ctx.fillStyle = `rgba(238, 236, 230, ${alpha * 0.95})`;
        ctx.shadowColor = `rgba(0, 0, 0, ${alpha * 0.35})`;
        ctx.shadowBlur = 2;
        ctx.shadowOffsetY = 1;
        ctx.fillRect(-halfW, -halfH, c.w, c.h);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // progressively reveal bars (printing animation)
        const revealFrac = Math.min(1, c.age / c.revealDuration);
        const revealCount = Math.ceil(c.bars.length * revealFrac);
        ctx.fillStyle = `rgba(8, 8, 8, ${alpha * 0.95})`;
        for (let k = 0; k < revealCount; k += 1) {
          const bar = c.bars[k];
          ctx.fillRect(-halfW + bar.x, -halfH + bar.y, bar.w - 0.2, bar.h);
        }

        // thin frame
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.55})`;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-halfW, -halfH, c.w, c.h);

        ctx.restore();

        if (c.age >= c.life) {
          cells.splice(i, 1);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("click", onClick);
      try {
        audio.pause();
        audio.src = "";
      } catch (_) {
        // ignore
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="bark-sound-canvas" aria-hidden="true" />;
}
