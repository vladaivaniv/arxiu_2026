import { useEffect, useRef } from "react";

export default function DroughtCracks() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    let raf = 0;
    let width = 0;
    let height = 0;
    const cracks = [];
    let lastX = -1;
    let lastY = -1;
    let accumDist = 0;
    let lastCrackEnd = null;

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

    // Build a jagged polyline made of straight angular segments
    const buildJaggedPath = (startX, startY, dirAngle, totalLen, segLen) => {
      const points = [{ x: startX, y: startY }];
      let x = startX;
      let y = startY;
      let angle = dirAngle;
      let remaining = totalLen;
      while (remaining > 0) {
        const step = Math.min(remaining, segLen * rand(0.7, 1.3));
        angle += rand(-0.55, 0.55);
        x += Math.cos(angle) * step;
        y += Math.sin(angle) * step;
        points.push({ x, y });
        remaining -= step;
      }
      return points;
    };

    // A "crack" object: a main jagged path + branches, each draws progressively, then fades
    const spawnCrack = (startX, startY, dirAngle, scale = 1) => {
      const mainLen = rand(20, 45) * scale;
      const mainPath = buildJaggedPath(startX, startY, dirAngle, mainLen, 5);
      const branches = [];

      // Add 2-5 angular branches off the main path (denser)
      const nBranches = 2 + Math.floor(Math.random() * 4);
      for (let b = 0; b < nBranches; b += 1) {
        const idx = Math.floor(rand(1, mainPath.length - 1));
        const root = mainPath[idx];
        const sign = Math.random() < 0.5 ? -1 : 1;
        const branchAngle = dirAngle + sign * rand(0.7, 1.3);
        const branchLen = mainLen * rand(0.25, 0.55);
        const branchPath = buildJaggedPath(root.x, root.y, branchAngle, branchLen, 4);
        branches.push({
          path: branchPath,
          startDelay: 6 + Math.floor(Math.random() * 10),
          widthMul: 0.55,
        });

        // chance of sub-branch
        if (Math.random() < 0.5) {
          const sub = buildJaggedPath(
            branchPath[Math.floor(branchPath.length / 2)].x,
            branchPath[Math.floor(branchPath.length / 2)].y,
            branchAngle + (Math.random() < 0.5 ? -1 : 1) * rand(0.6, 1.2),
            branchLen * rand(0.3, 0.55),
            6,
          );
          branches.push({
            path: sub,
            startDelay: 14 + Math.floor(Math.random() * 10),
            widthMul: 0.4,
          });
        }
      }

      cracks.push({
        main: { path: mainPath, startDelay: 0, widthMul: 1 },
        branches,
        age: 0,
        growSpeed: rand(0.7, 1.2), // points revealed per frame
        life: 90 + Math.floor(rand(0, 30)), // shorter life — quicker fade
        baseWidth: rand(0.7, 1.1) * scale,
      });
      lastCrackEnd = mainPath[mainPath.length - 1];
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
        return;
      }
      const px = (e.clientX - rect.left) * (width / rect.width);
      const py = (e.clientY - rect.top) * (height / rect.height);

      if (lastX >= 0) {
        const dx = px - lastX;
        const dy = py - lastY;
        accumDist += Math.hypot(dx, dy);
        // Spawn a new crack every ~22px of cursor travel for denser, connected look
        if (accumDist > 22) {
          const angle = Math.atan2(dy, dx) + rand(-0.4, 0.4);
          // Start from previous crack's end so they chain together (with a slight jitter)
          let sx = px;
          let sy = py;
          if (lastCrackEnd) {
            const distToLast = Math.hypot(px - lastCrackEnd.x, py - lastCrackEnd.y);
            if (distToLast < 120) {
              sx = lastCrackEnd.x + rand(-3, 3);
              sy = lastCrackEnd.y + rand(-3, 3);
            }
          }
          spawnCrack(sx, sy, angle, 1);
          accumDist = 0;
        }
      }
      lastX = px;
      lastY = py;
    };

    const onLeave = () => {
      lastX = -1;
      lastY = -1;
      accumDist = 0;
      lastCrackEnd = null;
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
      // big shatter: a few cracks radiating
      const n = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i += 1) {
        const angle = (Math.PI * 2 * i) / n + rand(-0.2, 0.2);
        spawnCrack(px, py, angle, 1.4);
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("click", onClick);

    const drawPath = (path, revealCount, alpha, lineWidth) => {
      if (revealCount < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < Math.min(revealCount, path.length); i += 1) {
        ctx.lineTo(path[i].x, path[i].y);
      }

      // dark shadow under crack for depth
      ctx.strokeStyle = `rgba(40, 18, 6, ${alpha * 0.55})`;
      ctx.lineWidth = lineWidth + 1.6;
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.stroke();

      // main warm crack body
      ctx.strokeStyle = `rgba(255, 165, 95, ${alpha * 0.95})`;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = "rgba(255, 90, 30, 0.55)";
      ctx.shadowBlur = 4;
      ctx.stroke();

      // bright inner highlight
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 240, 215, ${alpha * 0.7})`;
      ctx.lineWidth = Math.max(0.4, lineWidth * 0.4);
      ctx.stroke();
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = cracks.length - 1; i >= 0; i -= 1) {
        const crack = cracks[i];
        crack.age += 1;

        // alpha curve: brief peak, then quick fade over the last ~50 frames
        const fadeStart = crack.life - 50;
        let alpha = 1;
        if (crack.age > fadeStart) {
          alpha = Math.max(0, 1 - (crack.age - fadeStart) / 50);
        }

        const drawSubPath = (sub) => {
          const t = Math.max(0, crack.age - sub.startDelay);
          const revealCount = Math.min(
            sub.path.length,
            Math.floor(2 + t * crack.growSpeed),
          );
          drawPath(revealCount > 1 ? sub.path : [], revealCount, alpha, crack.baseWidth * sub.widthMul);
        };

        drawSubPath(crack.main);
        for (const branch of crack.branches) drawSubPath(branch);

        if (crack.age >= crack.life) {
          cracks.splice(i, 1);
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
    };
  }, []);

  return <canvas ref={canvasRef} className="drought-cracks-canvas" aria-hidden="true" />;
}
