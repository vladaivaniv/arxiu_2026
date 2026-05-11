import { useEffect, useRef } from "react";

export default function Panoptic() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let width = 0;
    let height = 0;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let prevX = 0;
    let prevY = 0;
    let angle = 0;
    let prev = performance.now();
    const startedAt = performance.now();
    let active = false;

    const secondaries = [];

    const buildSecondaries = () => {
      secondaries.length = 0;
      const count = 7;
      for (let i = 0; i < count; i += 1) {
        secondaries.push({
          x: Math.random() * width,
          y: Math.random() * height,
          phase: Math.random() * Math.PI * 2,
          appearAt: startedAt + 600 + i * 480 + Math.random() * 400,
          ttl: 4200 + Math.random() * 3500,
          pupilX: 0,
          pupilY: 0,
        });
      }
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (x === 0 && y === 0) {
        x = width * 0.5;
        y = height * 0.5;
        targetX = x;
        targetY = y;
        prevX = x;
        prevY = y;
      }
      if (secondaries.length === 0) buildSecondaries();
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
        active = false;
        return;
      }
      const sx = canvas.clientWidth / rect.width;
      const sy = canvas.clientHeight / rect.height;
      targetX = (e.clientX - rect.left) * sx;
      targetY = (e.clientY - rect.top) * sy;
      active = true;
    };

    document.addEventListener("mousemove", onMove);

    const drawAlmond = (w, h) => {
      ctx.beginPath();
      const k = w * 0.55;
      ctx.moveTo(-w, 0);
      ctx.bezierCurveTo(-k, -h * 1.15, k, -h * 1.15, w, 0);
      ctx.bezierCurveTo(k, h * 1.15, -k, h * 1.15, -w, 0);
      ctx.closePath();
    };

    const drawEye = (eyeW, eyeH, lidOpen, pupilOffsetX, pupilOffsetY, alpha = 1) => {
      drawAlmond(eyeW, eyeH * lidOpen);
      ctx.fillStyle = `rgba(0, 12, 30, ${(0.55 * alpha).toFixed(3)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(80, 170, 255, ${(0.9 * alpha).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (lidOpen > 0.2) {
        ctx.save();
        drawAlmond(eyeW, eyeH * lidOpen);
        ctx.clip();

        const irisR = eyeH * 0.88;
        const irisGrad = ctx.createRadialGradient(pupilOffsetX, pupilOffsetY, irisR * 0.2, pupilOffsetX, pupilOffsetY, irisR);
        irisGrad.addColorStop(0, `rgba(120, 200, 255, ${(0.85 * alpha).toFixed(3)})`);
        irisGrad.addColorStop(0.55, `rgba(30, 120, 220, ${(0.75 * alpha).toFixed(3)})`);
        irisGrad.addColorStop(1, `rgba(0, 30, 90, ${(0.85 * alpha).toFixed(3)})`);
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(pupilOffsetX, pupilOffsetY, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pupilR = eyeH * 0.42;
        ctx.fillStyle = `rgba(0, 0, 0, ${(0.95 * alpha).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(pupilOffsetX, pupilOffsetY, pupilR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(230, 245, 255, ${(0.85 * alpha).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(pupilOffsetX - pupilR * 0.35, pupilOffsetY - pupilR * 0.4, pupilR * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    };

    const aimPupil = (cx, cy, eyeH, currentX, currentY, lerpAmt) => {
      const dx = targetX - cx;
      const dy = targetY - cy;
      const dist = Math.hypot(dx, dy);
      const maxOff = eyeH * 0.55;
      const aimX = dist > 0 ? (dx / dist) * Math.min(dist, maxOff) : 0;
      const aimY = dist > 0 ? (dy / dist) * Math.min(dist, maxOff * 0.85) : 0;
      return {
        x: currentX + (aimX - currentX) * lerpAmt,
        y: currentY + (aimY - currentY) * lerpAmt,
      };
    };

    const tick = (now) => {
      const dt = Math.min(48, now - prev);
      prev = now;
      ctx.clearRect(0, 0, width, height);

      const elapsed = (now - startedAt) * 0.001;

      // ── ulls secundaris petits, fixos, amb pupil·la cap al cursor ──
      for (const s of secondaries) {
        const cycleAge = now - s.appearAt;
        if (cycleAge < 0) continue;
        const inCycle = cycleAge % s.ttl;
        const phase = inCycle / s.ttl;
        // envelope: 0 → 1 → 0 with plateau in middle
        let alpha;
        if (phase < 0.15) alpha = phase / 0.15;
        else if (phase > 0.85) alpha = (1 - phase) / 0.15;
        else alpha = 1;
        // recolocar quan reapareix
        if (Math.floor(cycleAge / s.ttl) !== s.lastCycle) {
          s.lastCycle = Math.floor(cycleAge / s.ttl);
          if (s.lastCycle > 0) {
            s.x = Math.random() * width;
            s.y = Math.random() * height;
            s.pupilX = 0;
            s.pupilY = 0;
          }
        }
        if (alpha <= 0.01) continue;

        const smallW = 12;
        const smallH = 5;

        // blink: tots parpellegen en moments diferents
        const sBlink = (elapsed + s.phase) % 5;
        let sLidOpen = 1;
        if (sBlink < 0.16) sLidOpen = Math.abs(Math.sin((sBlink / 0.16) * Math.PI));

        const aim = active
          ? aimPupil(s.x, s.y, smallH, s.pupilX, s.pupilY, Math.min(1, dt * 0.01))
          : { x: s.pupilX + (0 - s.pupilX) * Math.min(1, dt * 0.004), y: s.pupilY + (0 - s.pupilY) * Math.min(1, dt * 0.004) };
        s.pupilX = aim.x;
        s.pupilY = aim.y;

        ctx.save();
        ctx.translate(s.x, s.y);
        drawEye(smallW, smallH, sLidOpen, s.pupilX, s.pupilY, alpha);
        ctx.restore();
      }

      // ── ull principal: segueix el cursor però sense tocar-lo ──
      if (active) {
        // posició desitjada: una mica desplaçada del cursor
        const dx0 = targetX - x;
        const dy0 = targetY - y;
        const distRaw = Math.hypot(dx0, dy0);
        // mantenir distància mínima de ~70px del cursor
        const MIN_DIST = 70;
        let aimX = targetX;
        let aimY = targetY;
        if (distRaw > 0.001) {
          const nx = dx0 / distRaw;
          const ny = dy0 / distRaw;
          aimX = targetX - nx * MIN_DIST;
          aimY = targetY - ny * MIN_DIST;
        }
        x += (aimX - x) * Math.min(1, dt * 0.0035);
        y += (aimY - y) * Math.min(1, dt * 0.0035);

        const dx = x - prevX;
        const dy = y - prevY;
        if (Math.hypot(dx, dy) > 0.1) angle = Math.atan2(dy, dx);
        prevX = x;
        prevY = y;

        const eyeW = 14;
        const eyeH = 6;

        const blinkPhase = elapsed % 4.2;
        let lidOpen = 1;
        if (blinkPhase < 0.18) lidOpen = Math.abs(Math.sin((blinkPhase / 0.18) * Math.PI));

        // pupil·la cap al cursor
        const localDx = targetX - x;
        const localDy = targetY - y;
        const localDist = Math.hypot(localDx, localDy);
        const maxOff = eyeH * 0.55;
        const aimPX = localDist > 0 ? (localDx / localDist) * Math.min(localDist, maxOff) : 0;
        const aimPY = localDist > 0 ? (localDy / localDist) * Math.min(localDist, maxOff * 0.85) : 0;
        // pupil·la en coords locals (després de rotar). Hem de transformar.
        const cosA = Math.cos(-angle);
        const sinA = Math.sin(-angle);
        const lpx = aimPX * cosA - aimPY * sinA;
        const lpy = aimPX * sinA + aimPY * cosA;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        drawEye(eyeW, eyeH, lidOpen, lpx, lpy, 1);
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

  return <canvas ref={canvasRef} className="panoptic-canvas" aria-hidden="true" />;
}
