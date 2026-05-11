const assetModules = import.meta.glob(
  "../../assets/**/optimized/*.{jpg,jpeg,JPG,JPEG,png,PNG,webp,WEBP,mp4,MP4,webm,WEBM,ogg,OGG}",
  {
    eager: true,
    import: "default",
  },
);

const assetSorter = new Intl.Collator("ca", {
  numeric: true,
  sensitivity: "base",
});

// Keep the web gallery on broadly browser-safe formats.
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "ogg"]);
const OPTIMIZED_FOLDER_NAME = "optimized";

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
  const parentFolder = segments[segments.length - 2] ?? "";
  const projectFolder = parentFolder === OPTIMIZED_FOLDER_NAME
    ? segments[segments.length - 3]
    : parentFolder;

  return normalizeAssetKey(projectFolder ?? "");
}

function isOptimizedAsset(path) {
  const segments = path.split("/");
  return segments[segments.length - 2] === OPTIMIZED_FOLDER_NAME;
}

const groupedProjectAssets = Object.entries(assetModules).reduce((acc, [path, src]) => {
  const folderKey = getAssetFolderKey(path);
  const extension = getAssetExtension(path);

  if (!folderKey || !src) {
    return acc;
  }

  if (!acc[folderKey]) {
    acc[folderKey] = {
      photos: [],
      videos: [],
      optimizedPhotos: [],
      optimizedVideos: [],
    };
  }

  const isOptimized = isOptimizedAsset(path);

  if (VIDEO_EXTENSIONS.has(extension)) {
    const target = isOptimized ? acc[folderKey].optimizedVideos : acc[folderKey].videos;
    target.push({ path, src });
  } else {
    const target = isOptimized ? acc[folderKey].optimizedPhotos : acc[folderKey].photos;
    target.push({ path, src });
  }

  return acc;
}, {});

Object.values(groupedProjectAssets).forEach((entry) => {
  [
    entry.photos,
    entry.videos,
    entry.optimizedPhotos,
    entry.optimizedVideos,
  ].forEach((assets) => {
    assets.sort((a, b) => assetSorter.compare(a.path, b.path));
  });
});

function getPreferredPhotos(projectAssets) {
  return projectAssets.optimizedPhotos.length > 0
    ? projectAssets.optimizedPhotos
    : projectAssets.photos;
}

function getPreferredVideos(projectAssets) {
  return projectAssets.optimizedVideos.length > 0
    ? projectAssets.optimizedVideos
    : projectAssets.videos;
}

const FALLBACK_MEDIA_SRC = Object.values(groupedProjectAssets)
  .flatMap(getPreferredVideos)
  .map((entry) => entry.src)[0] ?? null;

const FALLBACK_MEDIA_ITEMS = FALLBACK_MEDIA_SRC
  ? [{ type: "video", src: FALLBACK_MEDIA_SRC }]
  : [];

function getProjectMedia(assetKey, excludedPathFragments = []) {
  const projectAssets = groupedProjectAssets[normalizeAssetKey(assetKey)];

  if (!projectAssets) {
    return {
      mediaSrc: FALLBACK_MEDIA_SRC,
      photos: [],
      mediaItems: FALLBACK_MEDIA_ITEMS,
    };
  }

  const shouldExclude = (entry) =>
    excludedPathFragments.some((fragment) => entry.path.includes(fragment));

  const videos = getPreferredVideos(projectAssets).filter((entry) => !shouldExclude(entry));
  const photos = getPreferredPhotos(projectAssets).filter((entry) => !shouldExclude(entry));
  const mediaSrc = videos[0]?.src ?? FALLBACK_MEDIA_SRC;
  const mediaItems = [
    ...videos.map((entry) => ({
      type: "video",
      src: entry.src,
      path: entry.path,
    })),
    ...photos.map((entry) => ({
      type: "image",
      src: entry.src,
      path: entry.path,
    })),
  ];

  return {
    mediaSrc,
    photos: photos.map((entry) => entry.src),
    mediaItems: mediaItems.length > 0
      ? mediaItems
      : FALLBACK_MEDIA_ITEMS,
  };
}

function prioritizeMediaItem(mediaData, pathFragment) {
  if (!pathFragment || !mediaData?.mediaItems?.length) return mediaData;

  const prioritizedIndex = mediaData.mediaItems.findIndex((item) =>
    item.src?.includes(pathFragment),
  );

  if (prioritizedIndex <= 0) return mediaData;

  const prioritizedItem = mediaData.mediaItems[prioritizedIndex];
  const mediaItems = [
    prioritizedItem,
    ...mediaData.mediaItems.filter((_, index) => index !== prioritizedIndex),
  ];

  return {
    ...mediaData,
    mediaSrc: prioritizedItem.type === "video" ? prioritizedItem.src : mediaData.mediaSrc,
    mediaItems,
  };
}

function prioritizeMediaItems(mediaData, pathFragments = []) {
  if (!pathFragments.length || !mediaData?.mediaItems?.length) return mediaData;

  return pathFragments.reduce(
    (acc, fragment) => prioritizeMediaItem(acc, fragment),
    mediaData,
  );
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
    ...getProjectMedia("END OF SHIFT", ["IMG_1242.optimized.jpg", "IMG_1242", "c794eb95-6e43-4e2b-9909-c6a647c0b91e.optimized"]),
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
    ...prioritizeMediaItems(
      getProjectMedia("QUAN NINGÚ MIRA", ["IMG_9187.optimized.mp4", "IMG_9180.optimized.mp4", "IMG_9177"]),
      ["f613669b-fadf-4902-927b-2668887fd34c.jpg"],
    ),
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
    ...prioritizeMediaItems(
      getProjectMedia("MODEL DE PODER MITJANÇANT EL DIÀLEG MECÀNIC", ["1.optimized.mp4"]),
      ["89b694ed-a0fa-45c7-9951-e651e89ffc61.jpg", "d429e19d-51e5-441d-aa3b-6e77e6891504.jpg"],
    ),
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
    ...getProjectMedia("OR DE FERRALLA", ["IMG_9197.optimized.mp4", "IMG_9197", "7082eadd-5d68-42a4-bb73-85fde7a64c39.optimized"]),
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
];

export const WORK_FILTERS = [
  "ART I CULTURA DIGITAL",
];

export const PROGRAM_SEPARATORS = {
  "ART I CULTURA DIGITAL": {
    titleLines: ["PROJECTES", "TREPAT"],
    subtitle: "Assignatura ART i Cultura Digital"
  },
};
