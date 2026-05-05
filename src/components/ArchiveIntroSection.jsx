import { useEffect, useState } from "react";
import ShuffleText from "./ShuffleText.jsx";

const ARCHIVE_INTRO = {
  title: "COM LLEGIR L'ARXIU",
  body: [
    "UN ESPAI DIGITAL QUE REUNEIX ELS PROJECTES DESENVOLUPATS A LES",
    "ASSIGNATURES D'ART I CULTURA DIGITAL I LABORATORI DE CREACIONS",
    "ARTÍSTIQUES.",
    "AQUÍ S'HI RECULL MATERIAL VISUAL, AUDIOVISUAL I INFORMACIÓ SOBRE CADA",
    "PROPOSTA I ELS SEUS AUTORS.",
  ],
};

const ASCII_LOADER_LINES = [
  "01000001 01010010 01010100 00101111 01000011 01010101 01001100 01010100",
  "LOAD::ARXIU_DIGITAL  ////  PROJECTES_VISUALS  ////  AUDIOVISUAL",
  "████░░░░░░ ████░░░░░░ ████░░░░░░ ████░░░░░░ ████░░░░░░",
  "A+C+D / LAB_CREACIONS / MATERIAL / AUTORS / INDEX / 000000",
  "00110000 00110001 00110010 00110011 00110100 00110101",
  "///// UN_ESPAI_DIGITAL ///// REUNINT_PROJECTES /////",
  "░░██░░██░░██░░██░░██░░██░░██░░██░░██░░██░░██░░██░░██",
  "BUFFERING_CONTEXT BUFFERING_CONTEXT BUFFERING_CONTEXT",
];

export default function ArchiveIntroSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const markAsLoaded = () => setIsLoaded(true);

    if (document.readyState === "complete") {
      markAsLoaded();
      return;
    }

    window.addEventListener("load", markAsLoaded, { once: true });

    return () => {
      window.removeEventListener("load", markAsLoaded);
    };
  }, []);

  const sectionStateClass = isLoaded ? "is-loaded" : "is-loading";

  return (
    <article
      className={`project-info-page archive-intro-section horizontal-panel ${sectionStateClass}`}
      aria-labelledby="archive-intro-title"
    >
      <h2 id="archive-intro-title" className="sr-only">
        {ARCHIVE_INTRO.title}
      </h2>

      {!isLoaded && (
        <div className="archive-intro-loader" aria-hidden="true">
          {ASCII_LOADER_LINES.map((line, index) => (
            <span key={`loader-line-${index}`}>{line}</span>
          ))}
        </div>
      )}

      <div className="project-info-body">
        {ARCHIVE_INTRO.body.map((line, index) => (
          <ShuffleText
            key={`archive-line-${index}`}
            text={line}
            delay={index * 170}
            duration={780}
            interval={3400 + index * 180}
            triggerOnView
            playOnce
            aria-label={line}
          />
        ))}
      </div>
    </article>
  );
}