import videoOne from "../../assets/video1.mov";

export const workEntries = [
  {
    title: "END OF SHIFT",
    authors: ["Said Marchouh", "Vlada Ivaniv"],
    year: "2026",
    tipus: "INSTAL·LACIÓ",
    duracio: "",
    format: "",
    tags: [],
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Una instal·lació que explora la substitució progressiva del treball humà per sistemes automatitzats. A través d'un procés lent i repetitiu, el material cau sobre una estructura tecnològica, mostrant com la presència humana es redueix mentre la tecnologia ocupa el seu lloc.",
    mediaSrc: videoOne,
    objectPosition: "50% 42%",
    photos: [],
  },
  {
    title: "POLAR ROOM",
    authors: ["AUTOR_03"],
    year: "2026",
    tipus: "INSTAL·LACIÓ VISUAL",
    duracio: "02:10",
    format: "1920x1080 / MP4",
    tags: ["ESPAI", "FRED", "MOVIMENT"],
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Entorn visual per a una campanya espacial, freda i immersiva, amb imatge en moviment com a centre d'una experiència atmosfèrica que dissol els límits entre publicitat i art.",
    mediaSrc: videoOne,
    objectPosition: "50% 52%",
    photos: [],
  },
  {
    title: "INDEX 04",
    authors: ["AUTOR_04", "AUTOR_05"],
    year: "2025",
    tipus: "INSTAL·LACIÓ",
    duracio: "03:00",
    format: "LOOP / HD",
    tags: ["ARXIU", "SENYAL", "GRÀFIC"],
    category: "INSTALLATION",
    program: "LABORATORI DE CREACIONS ARTISTIQUES",
    description: "Instal·lació que explora indexació, arxiu i senyal mitjançant un llenguatge gràfic de baixa resolució que tradueix memòria en estructura visual.",
    mediaSrc: videoOne,
    objectPosition: "50% 60%",
    photos: [],
  },
  {
    title: "SIGNAL",
    authors: ["AUTOR_06"],
    year: "2025",
    tipus: "EDITORIAL AUDIOVISUAL",
    duracio: "01:48",
    format: "1920x1080 / MP4",
    tags: ["MEMÒRIA", "DADES", "GEST"],
    category: "EDITORIAL",
    program: "LABORATORI DE CREACIONS ARTISTIQUES",
    description: "Sistema editorial audiovisual que tradueix memòria, dades i gest gràfic en una superfície en tensió on el so i la imatge construeixen un relat fragmentat.",
    mediaSrc: videoOne,
    objectPosition: "50% 48%",
    photos: [],
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
