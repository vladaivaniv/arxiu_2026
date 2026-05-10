const assetModules = import.meta.glob(
  "../../assets/**/*.{jpg,jpeg,JPG,JPEG,png,PNG,webp,WEBP,mov,MOV,mp4,MP4}",
  {
    eager: true,
    import: "default",
  },
);

const assetSorter = new Intl.Collator("ca", {
  numeric: true,
  sensitivity: "base",
});

const VIDEO_EXTENSIONS = new Set(["mov", "mp4", "webm", "ogg"]);

function normalizeAssetKey(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getAssetExtension(path) {
  const parts = path.split(".");
  return parts[parts.length - 1]?.toLowerCase() ?? "";
}

function getAssetFolderKey(path) {
  const segments = path.split("/");
  return normalizeAssetKey(segments[segments.length - 2] ?? "");
}

const groupedProjectAssets = Object.entries(assetModules).reduce((acc, [path, src]) => {
  const folderKey = getAssetFolderKey(path);
  const extension = getAssetExtension(path);

  if (!folderKey || !src) {
    return acc;
  }

  if (!acc[folderKey]) {
    acc[folderKey] = { photos: [], videos: [] };
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    acc[folderKey].videos.push({ path, src });
  } else {
    acc[folderKey].photos.push({ path, src });
  }

  return acc;
}, {});

Object.values(groupedProjectAssets).forEach((entry) => {
  entry.photos.sort((a, b) => assetSorter.compare(a.path, b.path));
  entry.videos.sort((a, b) => assetSorter.compare(a.path, b.path));
});

const FALLBACK_MEDIA_SRC = Object.values(groupedProjectAssets)
  .flatMap((entry) => entry.videos)
  .map((entry) => entry.src)[0] ?? null;

function getProjectMedia(assetKey) {
  const projectAssets = groupedProjectAssets[normalizeAssetKey(assetKey)];

  if (!projectAssets) {
    return {
      mediaSrc: FALLBACK_MEDIA_SRC,
      photos: [],
    };
  }

  return {
    mediaSrc: projectAssets.videos[0]?.src ?? FALLBACK_MEDIA_SRC,
    photos: projectAssets.photos.map((entry) => entry.src),
  };
}

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
    ...getProjectMedia("END OF SHIFT"),
    objectPosition: "50% 42%",
  },
  {
    title: "BLASTUR",
    authors: ["Sandra Salvia", "Sònia Soldevila"],
    year: "2026",
    tipus: "INSTAL·LACIÓ IMMERSIVA",
    duracio: "",
    format: "INSTAL·LACIÓ",
    tags: ["MAR", "CAPITALISME", "INTERACCIÓ"],
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Instal·lació immersiva audiovisual que transforma el moviment del mar en una metàfora del cicle capitalista repetitiu i de la falsa llibertat digital. A través d'un flux visual que evoluciona de la calma a la tensió, l'obra crea una experiència sensorial que confronta l'espectador amb l'esgotament, la repetició i la pressió constant dels sistemes contemporanis. La peça combina animació 3D, so espacial i interacció amb sensors per convertir el visitant en part activa del sistema.",
    ...getProjectMedia("BLASTUR"),
    objectPosition: "50% 52%",
  },
  {
    title: "QUAN NINGÚ MIRA",
    authors: ["Francesc Bonnin", "Sergio Ramos"],
    year: "2026",
    tipus: "INSTAL·LACIÓ INTERACTIVA",
    duracio: "",
    format: "INSTAL·LACIÓ",
    tags: ["BOICOT", "RESISTÈNCIA", "ACCIÓ COL·LECTIVA"],
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Instal·lació interactiva que reflexiona sobre el boicot i la resistència col·lectiva dins del context industrial. A través d'una capsa aparentment anònima, el públic activa un sistema ocult que revela vídeos, so i missatges vinculats a lluites laborals, invisibilització i acció compartida. L'obra transforma un gest mínim en una metàfora sobre el poder de l'acció col·lectiva.",
    ...getProjectMedia("QUAN NINGÚ MIRA"),
    objectPosition: "50% 50%",
  },
  {
    title: "EL MASCLISME SEMPRE GUANYA",
    authors: ["Nerea Marí", "Sergi Escarré"],
    year: "2026",
    tipus: "INSTAL·LACIÓ INTERACTIVA",
    duracio: "",
    format: "INSTAL·LACIÓ / ARDUINO",
    tags: ["VIOLÈNCIA", "GÈNERE", "CRÍTICA SOCIAL"],
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Instal·lació interactiva que denuncia la culpabilització de les víctimes en casos de violència masclista. A través d'una ruleta LED programada amb Arduino, l'obra simula un joc aparentment aleatori que sempre acaba en el mateix resultat: responsabilitzar la víctima. Una metàfora directa d'un sistema social manipulat des del principi.",
    ...getProjectMedia("EL MASCLISME SEMPRE GUANYA"),
    objectPosition: "50% 45%",
  },
  {
    title: "MODEL DE PODER MITJANÇANT EL DIÀLEG MECÀNIC",
    authors: ["Eudald Cardozo", "Valentina Coello"],
    year: "2026",
    tipus: "INSTAL·LACIÓ INTERACTIVA",
    duracio: "",
    format: "INSTAL·LACIÓ",
    tags: ["PODER", "JERARQUIA", "TREBALL"],
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Instal·lació interactiva per a dues persones que reprodueix una relació de poder entre director i treballador. A través d'un sistema de botons, instruccions i tasques repetitives, l'obra converteix el joc en una experiència crítica sobre jerarquia, obediència, pressió laboral i desigualtat dins l'entorn industrial.",
    ...getProjectMedia("MODEL DE PODER MITJANÇANT EL DIÀLEG MECÀNIC"),
    objectPosition: "50% 55%",
  },
  {
    title: "ALLÒ QUE PROJECTEM",
    authors: ["Lídia Alcalde", "Paula Bailach"],
    year: "2026",
    tipus: "INSTAL·LACIÓ VIDEO MAPPING",
    duracio: "",
    format: "VIDEO MAPPING",
    tags: ["GÈNERE", "PODER", "MEMÒRIA"],
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Instal·lació de video mapping sobre dos maniquins que reflexiona sobre els rols de gènere dins el context industrial de la Fàbrica Trepat. A través de la llum, la intel·ligència artificial i el cos, l'obra transforma paraules associades a homes i dones en atmosferes visuals que mostren poder, invisibilització i memòria.",
    ...getProjectMedia("ALLÒ QUE PROJECTEM"),
    objectPosition: "50% 50%",
  },
  {
    title: "OR DE FERRALLA",
    authors: ["Berta Güell"],
    year: "2026",
    tipus: "PROJECTE EXPOSITIU",
    duracio: "",
    format: "INSTAL·LACIÓ / IA",
    tags: ["FERRALLA", "JOIERIA", "MEMÒRIA INDUSTRIAL"],
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Projecte expositiu que transforma ferralla, òxid i memòria industrial en joieria contemporània mitjançant processos d'intel·ligència artificial. L'obra explora el valor simbòlic dels materials obsolets i la relació entre tecnologia, procés i absència dins l'espai industrial del Museu Trepat.",
    ...getProjectMedia("OR DE FERRALLA"),
    objectPosition: "50% 45%",
  },
  {
    title: "PANÒPTIC DIGITAL",
    authors: ["Miriam Llaquet", "Andrea Ginés"],
    year: "2026",
    tipus: "INSTAL·LACIÓ IMMERSIVA",
    duracio: "",
    format: "INSTAL·LACIÓ",
    tags: ["VIGILÀNCIA", "CONTROL", "DIGITAL"],
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Instal·lació immersiva que explora la vigilància laboral i la transformació del control físic de les fàbriques en la vigilància digital contemporània. Mitjançant una estructura metàl·lica en forma de panòptic, pantalles mòbils i visuals reactius generats en temps real, l'obra crea una tensió constant entre observador i observat, convertint l'espectador en part activa del sistema de control.",
    ...getProjectMedia("PANÒPTIC DIGITAL"),
    objectPosition: "50% 52%",
  },
  {
    title: "PRIVILEGIADOS",
    authors: ["Martina López", "Júlia Calvo"],
    year: "2026",
    tipus: "INSTAL·LACIÓ INTERACTIVA",
    duracio: "",
    format: "INSTAL·LACIÓ / 3D",
    tags: ["EXPLOTACIÓ", "INFÀNCIA", "CRÍTICA SOCIAL"],
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Instal·lació interactiva que reflexiona sobre l'explotació infantil i els privilegis socials. Mitjançant figures impreses en 3D, informació oculta i àudio interactiu, l'obra transforma l'espectador en part activa de l'experiència i fa visible una realitat sovint ignorada. La peça convida a qüestionar la indiferència social davant aquesta problemàtica i explora com normalitzem formes d'explotació invisibilitzades dins la societat contemporània.",
    ...getProjectMedia("PRIVILEGIADOS"),
    objectPosition: "50% 48%",
  },
  {
    title: "MEASURED SELF",
    authors: ["Nico Gómez", "Pau Romero"],
    year: "2026",
    tipus: "INSTAL·LACIÓ",
    duracio: "",
    format: "INSTAL·LACIÓ",
    tags: ["DADES", "COS", "AUTOREGISTRE"],
    category: "COMMERCIAL",
    program: "ART I CULTURA DIGITAL",
    description: "Instal·lació interactiva que reflexiona sobre l'extractivisme de dades i la vigilància digital contemporània. Mitjançant una webcam, TouchDesigner i projecció en temps real, l'obra captura els moviments de l'espectador i els transforma en visualitzacions que evidencien com el cos, els gestos i la presència es converteixen en informació extraïble dins l'entorn digital.",
    ...getProjectMedia("MEASURED SELF"),
    objectPosition: "50% 50%",
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
    mediaSrc: FALLBACK_MEDIA_SRC,
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
    mediaSrc: FALLBACK_MEDIA_SRC,
    objectPosition: "50% 48%",
    photos: [],
  },
  {
    title: "MESURA DEL JO",
    authors: ["AUTOR_11"],
    year: "2025",
    tipus: "PEÇA GENERATIVA",
    duracio: "02:30",
    format: "GENERATIU / HD",
    tags: ["IDENTITAT", "DADES", "AUTORETRAT"],
    category: "INSTALLATION",
    program: "LABORATORI DE CREACIONS ARTISTIQUES",
    description: "Autoretrat generat a partir de dades personals recollides durant un mes. Cada paràmetre —son, moviment, temperatura— es converteix en línia, color i textura dins d'una composició en constant mutació.",
    mediaSrc: FALLBACK_MEDIA_SRC,
    objectPosition: "50% 50%",
    photos: [],
  },
  {
    title: "PANÒPTIC",
    authors: ["AUTOR_12", "AUTOR_13"],
    year: "2025",
    tipus: "VÍDEO-INSTAL·LACIÓ",
    duracio: "05:10",
    format: "LOOP / 4K",
    tags: ["VIGILÀNCIA", "ESPAI", "PODER"],
    category: "INSTALLATION",
    program: "LABORATORI DE CREACIONS ARTISTIQUES",
    description: "Vídeo-instal·lació inspirada en l'arquitectura panòptica de Bentham. Les càmeres es vigilen entre elles en un bucle infinit que posa en qüestió qui observa i qui és observat.",
    mediaSrc: FALLBACK_MEDIA_SRC,
    objectPosition: "50% 40%",
    photos: [],
  },
  {
    title: "OR DE FERRALLA",
    authors: ["AUTOR_14"],
    year: "2025",
    tipus: "ESCULTURA SONORA",
    duracio: "",
    format: "INSTAL·LACIÓ",
    tags: ["MATERIAL", "SO", "RESIDUS"],
    category: "INSTALLATION",
    program: "LABORATORI DE CREACIONS ARTISTIQUES",
    description: "Escultura sonora construïda amb materials de rebuig industrial. Els objectes descartats generen freqüències que transformen l'espai en un paisatge sonor on la bellesa emergeix del que és considerat inútil.",
    mediaSrc: FALLBACK_MEDIA_SRC,
    objectPosition: "50% 58%",
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
