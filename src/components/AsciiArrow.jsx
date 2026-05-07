import { useEffect, useRef, useState } from "react";

// Sequence: builds up → cycles styles → resets
const SEQUENCE = [
  { text: "[>    ]", hold: 80  },
  { text: "[->>  ]", hold: 80  },
  { text: "[-->  ]", hold: 80  },
  { text: "[--->]",  hold: 80  },
  { text: "[---->]", hold: 320 },
  { text: "[====>]", hold: 220 },
  { text: "[~~~~>]", hold: 220 },
  { text: "[>>>>]",  hold: 220 },
  { text: "[••••>]", hold: 220 },
  { text: "[---->]", hold: 500 },
];

export default function AsciiArrow({ className }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let current = 0;

    const tick = () => {
      current = (current + 1) % SEQUENCE.length;
      setIdx(current);
      timerRef.current = setTimeout(tick, SEQUENCE[current].hold);
    };

    timerRef.current = setTimeout(tick, SEQUENCE[0].hold);

    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <span className={className} aria-hidden="true">
      {SEQUENCE[idx].text}
    </span>
  );
}
