import { useEffect, useRef } from "react";
import calmAudioSrc from "../../assets/projectes_art_digital/TACTE HUMÀ/tacte_huma_calm.mp3";
import activeAudioSrc from "../../assets/projectes_art_digital/TACTE HUMÀ/tacte_huma_active.mp3";

export default function WaterTouch() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    let raf = 0;
    let width = 0;
    let height = 0;

    // Two water tracks: a calm ambient water + an active "disturbed" water that takes over
    // while the cursor moves and the surface is being touched.
    const calmAudio = new Audio(calmAudioSrc);
    const activeAudio = new Audio(activeAudioSrc);
    calmAudio.loop = true;
    activeAudio.loop = true;
    calmAudio.preload = "auto";
    activeAudio.preload = "auto";
    calmAudio.volume = 0;
    activeAudio.volume = 0;
    const CALM_MAX = 0.12;
    const ACTIVE_MAX = 0.18;
    const FADE_FAST = 0.08;   // active swap is rapid
    const FADE_SLOW = 0.025;  // calm fades more gently
    let calmStarted = false;
    let activeStarted = false;
    let calmTarget = 0;
    let activeTarget = 0;
    let cursorInside = false;
    let lastMoveTs = 0;
    const MOVE_TIMEOUT_MS = 350; // active fades back to silence after this long without movement

    const tryStartCalm = () => {
      if (calmStarted) return;
      calmAudio.play().then(() => { calmStarted = true; }).catch(() => { calmStarted = false; });
    };
    const tryStartActive = () => {
      if (activeStarted) return;
      activeAudio.play().then(() => { activeStarted = true; }).catch(() => { activeStarted = false; });
    };

    // low-res simulation grid, upscaled for performance
    const SCALE = 4;
    let gw = 0;
    let gh = 0;
    let prev = null;
    let curr = null;
    let imageData = null;
    let buf = null;
    let lastMx = -1;
    let lastMy = -1;

    const allocate = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;
      gw = Math.max(2, Math.floor(width / SCALE));
      gh = Math.max(2, Math.floor(height / SCALE));
      prev = new Float32Array(gw * gh);
      curr = new Float32Array(gw * gh);
      imageData = ctx.createImageData(width, height);
      buf = new Uint32Array(imageData.data.buffer);
    };

    allocate();
    const ro = new ResizeObserver(allocate);
    ro.observe(canvas);

    const drop = (gx, gy, strength) => {
      if (gx < 1 || gy < 1 || gx >= gw - 1 || gy >= gh - 1) return;
      const i = gy * gw + gx;
      prev[i] += strength;
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const insideWater =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!insideWater) {
        cursorInside = false;
        return;
      }
      // cursor is over the water → mark inside and record movement timestamp
      cursorInside = true;
      lastMoveTs = performance.now();

      const px = (e.clientX - rect.left) * (width / rect.width);
      const py = (e.clientY - rect.top) * (height / rect.height);
      const gx = Math.floor(px / SCALE);
      const gy = Math.floor(py / SCALE);

      // interpolate between last and current to leave a continuous trail
      if (lastMx >= 0) {
        const dx = gx - lastMx;
        const dy = gy - lastMy;
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy)));
        for (let s = 0; s <= steps; s += 1) {
          const t = s / steps;
          drop(Math.round(lastMx + dx * t), Math.round(lastMy + dy * t), 6);
        }
      } else {
        drop(gx, gy, 6);
      }
      lastMx = gx;
      lastMy = gy;
    };

    const onLeave = () => {
      lastMx = -1;
      lastMy = -1;
      cursorInside = false;
    };

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
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
      const gx = Math.floor(px / SCALE);
      const gy = Math.floor(py / SCALE);
      // big splash
      drop(gx, gy, 35);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("click", onClick);

    const DAMPING = 0.99;

    // Section-out-of-view silencer: when the canvas leaves the viewport, drop volumes.
    // Audio only starts when the cursor moves over the canvas (handled in onMove).
    let io = null;
    try {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.1) {
              calmTarget = 0;
              activeTarget = 0;
            }
          }
        },
        { threshold: [0, 0.1] },
      );
      io.observe(canvas);
    } catch (_) {
      // ignore — older browsers
    }

    const audioStep = () => {
      const now = performance.now();
      const isMoving = cursorInside && now - lastMoveTs < MOVE_TIMEOUT_MS;

      // derive volume targets from cursor state
      if (cursorInside) {
        // water (calm) plays whenever cursor is over the project
        tryStartCalm();
        if (isMoving) {
          // movement → start active (technology) and duck calm slightly
          tryStartActive();
          activeTarget = ACTIVE_MAX;
          calmTarget = CALM_MAX * 0.55;
        } else {
          // cursor over but not moving → only water sound
          activeTarget = 0;
          calmTarget = CALM_MAX;
        }
      } else {
        calmTarget = 0;
        activeTarget = 0;
      }

      // fade volumes toward targets (active fades fast, calm slower)
      if (calmAudio.volume < calmTarget) {
        calmAudio.volume = Math.min(calmTarget, calmAudio.volume + FADE_SLOW);
      } else if (calmAudio.volume > calmTarget) {
        calmAudio.volume = Math.max(calmTarget, calmAudio.volume - FADE_SLOW);
      }
      if (activeAudio.volume < activeTarget) {
        activeAudio.volume = Math.min(activeTarget, activeAudio.volume + FADE_FAST);
      } else if (activeAudio.volume > activeTarget) {
        activeAudio.volume = Math.max(activeTarget, activeAudio.volume - FADE_FAST);
      }

      // pause when silent to save resources
      if (calmAudio.volume <= 0.001 && calmStarted) {
        calmAudio.pause();
        calmStarted = false;
      }
      if (activeAudio.volume <= 0.001 && activeStarted) {
        activeAudio.pause();
        activeStarted = false;
      }
    };

    const tick = () => {
      audioStep();

      // propagate wave: curr = (neighbors avg) - prev, damped
      for (let y = 1; y < gh - 1; y += 1) {
        const row = y * gw;
        for (let x = 1; x < gw - 1; x += 1) {
          const i = row + x;
          const n =
            (prev[i - 1] + prev[i + 1] + prev[i - gw] + prev[i + gw]) * 0.5 -
            curr[i];
          curr[i] = n * DAMPING;
        }
      }
      // swap
      const tmp = prev;
      prev = curr;
      curr = tmp;

      // render: use horizontal gradient of height as light displacement
      const data = buf;
      for (let py = 0; py < height; py += 1) {
        const gy = Math.min(gh - 1, Math.max(0, Math.floor(py / SCALE)));
        const rowG = gy * gw;
        const rowP = py * width;
        for (let px = 0; px < width; px += 1) {
          const gx = Math.min(gw - 1, Math.max(0, Math.floor(px / SCALE)));
          const i = rowG + gx;
          const h = prev[i];
          const gxg = prev[i + 1] - prev[i - 1] || 0;
          const gyg = prev[i + gw] - prev[i - gw] || 0;
          const lightness = (gxg - gyg) * 0.05;
          const activity = Math.abs(gxg) + Math.abs(gyg) + Math.abs(h) * 0.5;
          if (activity < 0.6) {
            data[rowP + px] = 0;
            continue;
          }
          const hi = Math.max(0, lightness);
          const r = Math.min(255, hi * 200 + 30);
          const g = Math.min(255, hi * 230 + 60);
          const b = Math.min(255, hi * 255 + 100);
          const a = Math.min(255, activity * 18);
          data[rowP + px] = (a << 24) | (b << 16) | (g << 8) | r;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (io) io.disconnect();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("click", onClick);
      try {
        calmAudio.pause();
        calmAudio.src = "";
        activeAudio.pause();
        activeAudio.src = "";
      } catch (_) {
        // ignore
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="water-touch-canvas" aria-hidden="true" />;
}
