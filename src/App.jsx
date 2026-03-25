import { useEffect, useState } from "react";

const artRows = ["ART", "A4T", "R7T", "A#T", "AR+", "4RT", "A:T", "AR*", "A%T", "A=T", "ART", "RRT"];
const shuffleGlyphs = "ART4#%+=:*R/TX3";
const totalRows = 50;

function buildRow(seed) {
  return Array.from({ length: 36 }, (_, index) => {
    const chars = seed.split("");
    const nextChar = shuffleGlyphs[(index * 3 + seed.charCodeAt(index % seed.length)) % shuffleGlyphs.length];

    return chars
      .map((char, charIndex) => ((index + charIndex) % 3 === 0 ? nextChar : char))
      .join("")
      .padEnd(4, nextChar);
  }).join("  ");
}

function WordMask() {
  const [rows, setRows] = useState(() =>
    Array.from({ length: totalRows }, (_, index) => buildRow(artRows[index % artRows.length])),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRows((currentRows) =>
        currentRows.map((_, index) => {
          const seed = artRows[(index + Math.floor(Math.random() * artRows.length)) % artRows.length];

          return buildRow(seed);
        }),
      );
    }, 75);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="word-mask" aria-hidden="true">
      <svg className="word-svg" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id="art-shape">
            <text x="50%" y="56%" textAnchor="middle" className="art-clip-text">
              Art
            </text>
          </clipPath>
        </defs>

        <g clipPath="url(#art-shape)">
          {rows.map((row, index) => (
            <text
              key={`row-${index}`}
              x="50%"
              y={102 + index * 5.65}
              textAnchor="middle"
              className={`word-row word-row-${(index % 4) + 1}`}
              style={{
                animationDelay: `${index * 45}ms`,
                transitionDelay: `${index * 8}ms`,
              }}
            >
              {row}
            </text>
          ))}
        </g>

        <text x="50%" y="56%" textAnchor="middle" className="art-outline-text">
          Art
        </text>
      </svg>
    </div>
  );
}

export default function App() {
  return (
    <main className="landing-shell">
      <div className="noise-layer" aria-hidden="true" />
      <div className="scanline-layer" aria-hidden="true" />
      <section className="hero-section">
        <WordMask />

        <div className="copy copy-left">
          <p>COL.LECCIO DE</p>
          <p>PROJECTES ARTISTICS</p>
        </div>

        <div className="copy copy-right">
          <p>UN ESPAI DIGITAL QUE REUNEIX ELS PROJECTES DESENVOLUPATS A LES</p>
          <p>ASSIGNATURES D&apos;ART I CULTURA DIGITAL I LABORATORI DE CREACIONS</p>
          <p>ARTISTIQUES.</p>
          <p>AQUI S&apos;HI RECULL MATERIAL VISUAL, AUDIOVISUAL I INFORMACIO SOBRE CADA</p>
          <p>PROPOSTA I ELS SEUS AUTORS.</p>
        </div>
      </section>
    </main>
  );
