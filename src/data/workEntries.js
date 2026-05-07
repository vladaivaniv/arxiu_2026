import videoOne from "../../assets/video1.mov";

export const workEntries = [
  {
    title: "KASY",
    authors: ["AUTOR_01", "AUTOR_02"],
    year: "2025",
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Peca audiovisual interactiva construida amb textura digital, ritme comercial i presencia de marca.",
    mediaSrc: videoOne,
    objectPosition: "50% 42%",
  },
  {
    title: "POLAR ROOM",
    authors: ["AUTOR_03"],
    year: "2025",
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Entorn visual per a una campanya espacial, freda i immersiva, amb imatge en moviment com a centre.",
    mediaSrc: videoOne,
    objectPosition: "50% 52%",
  },
  {
    title: "INDEX 04",
    authors: ["AUTOR_04", "AUTOR_05"],
    year: "2024",
    category: "INSTALLATION",
    program: "LABORATORI DE CREACIONS ARTISTIQUES",
    description: "Instal.lacio que explora indexacio, arxiu i senyal mitjancant un llenguatge grafic de baixa resolucio.",
    mediaSrc: videoOne,
    objectPosition: "50% 60%",
  },
  {
    title: "SIGNAL",
    authors: ["AUTOR_06"],
    year: "2024",
    category: "EDITORIAL",
    program: "LABORATORI DE CREACIONS ARTISTIQUES",
    description: "Sistema editorial audiovisual que tradueix memoria, dades i gest grafic en una superficie en tensio.",
    mediaSrc: videoOne,
    objectPosition: "50% 48%",
  },
];

export const WORK_FILTERS = [
  "ART I CULTURA DIGITAL",
  "LABORATORI DE CREACIONS ARTISTIQUES",
];

export const PROGRAM_SEPARATORS = {
  "ART I CULTURA DIGITAL": {
    titleLines: ["PROJECTES", "TREPAT"],
    subtitle: "Assignatura ART i Cultura Digital"
  },
  "LABORATORI DE CREACIONS ARTISTIQUES": {
    titleLines: ["LABORATORI", "CREACIONS", "ARTÍSTIQUES"],
    subtitle: "Assignatura Laboratori de Creacions Artístiques"
  },
};
