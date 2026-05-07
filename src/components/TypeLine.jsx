import { useEffect, useState } from "react";

export default function TypeLine({ text, delay = 0, speed = 28, as: Tag = "p", className }) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!text) return;
    setRevealed(0);
    let interval;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setRevealed((r) => {
          if (r >= text.length) { clearInterval(interval); return r; }
          return r + 1;
        });
      }, speed);
    }, delay);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [text, delay, speed]);

  return (
    <Tag className={className}>
      {text.slice(0, revealed)}
      {revealed < text.length && <span className="type-cursor" aria-hidden="true">_</span>}
    </Tag>
  );
}
