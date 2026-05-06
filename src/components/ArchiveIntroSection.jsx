import { useEffect, useState } from "react";
import AsciiBackground from "./AsciiBackground.jsx";
import ShuffleText from "./ShuffleText.jsx";
import WordMask from "./WordMask.jsx";

const ARCHIVE_INTRO = {
  title: "[2026]",
  body: [
    "Aquest espai reuneix els projectes creats durant el curs a les assignatures d’Art i",
    "Cultura Digital i Laboratori de Creacions Artístiques. Un espai per descobrir",
    "processos creatius, peces digitals i mirades artístiques del curs.",
    "",
    "Cada projecte inclou una breu explicació, materials visuals i informació sobre",
    "l’autor o autora, mostrant diferents maneres d’explorar la creació digital.",
  ],
  stats: [
    { label: "Projectes", value: "10" },
    { label: "Autors", value: "20" },
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

      <AsciiBackground color="#000000" opacity={0.18} />

      {!isLoaded && (
        <div className="archive-intro-loader" aria-hidden="true">
          {ASCII_LOADER_LINES.map((line, index) => (
            <span key={`loader-line-${index}`}>{line}</span>
          ))}
        </div>
      )}

      <div className="archive-intro-layout">
        <div className="project-info-body archive-intro-copy">
          {ARCHIVE_INTRO.body.map((line, index) => (
            <ShuffleText
              key={`archive-line-${index}`}
              text={line}
              delay={index * 100}
              duration={200}
              interval={200 + index * 180}
              aria-label={line}
            />
          ))}
        </div>

        <div className="archive-intro-stats" aria-label="Dades de l'arxiu">
          {ARCHIVE_INTRO.stats.map((stat, index) => (
            <div key={stat.label} className="archive-intro-stat">
              <ShuffleText
                text={`${stat.label}: ${stat.value}`}
                delay={index * 180}
                duration={780}
                interval={1000 + index * 220}
                aria-label={`${stat.label}: ${stat.value}`}
              />
            </div>
          ))}
        </div>

      </div>

      <div className="archive-intro-footer" aria-hidden="true">
        <ShuffleText text="[ ARXIU_2026 ]" interval={3000} duration={600} />
      </div>
    </article>
  );
}
