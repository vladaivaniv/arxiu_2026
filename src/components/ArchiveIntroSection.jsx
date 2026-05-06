import { useEffect, useState } from "react";
import ShuffleText from "./ShuffleText.jsx";

const ARCHIVE_INTRO = {
  title: "[ ARXIU_2026 ]",
  body: [
    "Aquest espai reuneix els projectes creats durant el curs a les assignatures d’Art i",
    "Cultura Digital i Laboratori de Creacions Artístiques. Un espai per descobrir",
    "processos creatius, peces digitals i mirades artístiques del curs.",
    "",
    "Cada projecte inclou una breu explicació, materials visuals i informació sobre",
    "l’autor o autora, mostrant diferents maneres d’explorar la creació digital.",
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