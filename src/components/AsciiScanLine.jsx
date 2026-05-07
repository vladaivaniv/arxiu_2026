import { useEffect, useRef, useState } from "react";

const GLYPHS = "ART4#%+=:*R/TX3ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@><_/\\|";

function scramble(text, len) {
  let result = "";
  for (let i = 0; i < len; i++) {
    const c = text[i];
    result += /[A-Z0-9a-z]/i.test(c)
      ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      : c;
  }
  return result;
}

export default function AsciiScanLine({ text, className, speed = 48 }) {
  const [display, setDisplay] = useState("");
  const stateRef = useRef({ head: 0, dir: 1, wait: 0 });

  useEffect(() => {
    let animId;
    let last = 0;

    const tick = (time) => {
      animId = requestAnimationFrame(tick);
      if (time - last < speed) return;
      last = time;

      const s = stateRef.current;

      if (s.wait > 0) {
        s.wait--;
        setDisplay(scramble(text, s.head));
        return;
      }

      s.head += s.dir;

      if (s.head >= text.length) {
        s.head = text.length;
        s.dir = -1;
        s.wait = 20;
      } else if (s.head <= 0) {
        s.head = 0;
        s.dir = 1;
        s.wait = 10;
      }

      setDisplay(scramble(text, s.head));
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [text, speed]);

  return (
    <p className={className}>
      {display}<span className="ascii-scan-cursor">_</span>
    </p>
  );
}
