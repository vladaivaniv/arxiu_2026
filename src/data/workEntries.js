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
const VIDEO_POSTER_SUFFIX = ".poster";

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

function getAssetBaseName(path) {
  const parsedPath = path.split("/").pop() ?? "";
  const parts = parsedPath.split(".");

  if (parts.length <= 1) {
    return parsedPath;
  }

  parts.pop();
  return parts.join(".");
}

function isGeneratedVideoPoster(path) {
  return getAssetBaseName(path).endsWith(VIDEO_POSTER_SUFFIX);
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
      posters: new Map(),
      optimizedPosters: new Map(),
    };
  }

  const isOptimized = isOptimizedAsset(path);
  const isPoster = isGeneratedVideoPoster(path);
  const baseName = getAssetBaseName(path);

  if (VIDEO_EXTENSIONS.has(extension)) {
    const target = isOptimized ? acc[folderKey].optimizedVideos : acc[folderKey].videos;
    target.push({ path, src, baseName });
  } else if (isPoster) {
    const target = isOptimized ? acc[folderKey].optimizedPosters : acc[folderKey].posters;
    target.set(baseName.replace(/\.poster$/i, ""), { path, src });
  } else {
    const target = isOptimized ? acc[folderKey].optimizedPhotos : acc[folderKey].photos;
    target.push({ path, src, baseName });
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

function getPreferredPosters(projectAssets) {
  return projectAssets.optimizedPosters.size > 0
    ? projectAssets.optimizedPosters
    : projectAssets.posters;
}

function sortMediaItemsWithVideosFirst(items = []) {
  const videos = items.filter((item) => item?.type === "video");
  const images = items.filter((item) => item?.type !== "video");

  return [...videos, ...images];
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

  const posters = getPreferredPosters(projectAssets);
  const videos = getPreferredVideos(projectAssets).filter((entry) => !shouldExclude(entry));
  const photos = getPreferredPhotos(projectAssets).filter((entry) => !shouldExclude(entry));
  const mediaSrc = videos[0]?.src ?? FALLBACK_MEDIA_SRC;
  const mediaItems = [
    ...videos.map((entry) => ({
      type: "video",
      src: entry.src,
      path: entry.path,
      posterSrc: posters.get(entry.baseName)?.src ?? null,
    })),
    ...photos.map((entry) => ({
      type: "image",
      src: entry.src,
      path: entry.path,
    })),
  ];
  const sortedMediaItems = sortMediaItemsWithVideosFirst(mediaItems);

  return {
    mediaSrc,
    photos: photos.map((entry) => entry.src),
    mediaItems: sortedMediaItems.length > 0
      ? sortedMediaItems
      : FALLBACK_MEDIA_ITEMS,
  };
}

function prioritizeMediaItem(mediaData, pathFragment) {
  if (!pathFragment || !mediaData?.mediaItems?.length) return mediaData;

  const prioritizedIndex = mediaData.mediaItems.findIndex((item) =>
    item.src?.includes(pathFragment) || item.path?.includes(pathFragment),
  );

  if (prioritizedIndex <= 0) return mediaData;

  const prioritizedItem = mediaData.mediaItems[prioritizedIndex];
  const mediaItems = sortMediaItemsWithVideosFirst([
    prioritizedItem,
    ...mediaData.mediaItems.filter((_, index) => index !== prioritizedIndex),
  ]);
  const firstVideo = mediaItems.find((item) => item.type === "video");

  return {
    ...mediaData,
    mediaSrc: firstVideo?.src ?? mediaData.mediaSrc,
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
      getProjectMedia("QUAN NINGÚ MIRA", ["IMG_9180.optimized.mp4", "IMG_9177", "IMG_9187.optimized"]),
      ["Video.optimized.mp4", "f613669b-fadf-4902-927b-2668887fd34c.jpg"],
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
  {
    title: "TACTE HUMÀ",
    authors: ["Vlada Ivaniv"],
    year: "2025",
    tipus: "INSTAL·LACIÓ INTERACTIVA",
    duracio: "",
    format: "INSTAL·LACIÓ",
    tags: ["AIGUA", "TACTE", "NATURA"],
    category: "COMMERCIAL",
    program: "LABORATORI DE CREACIONS ARTISTIQUES",
    description: "Una obra interactiva sobre la transformació de l'aigua a través de la intervenció humana. A partir del tacte, la peça activa una resposta de llum i so que simbolitza el pas d'un estat natural a un altre de més artificial i funcional. El projecte reflexiona sobre com un recurs natural essencial pot canviar de significat quan passa a formar part de sistemes tecnològics i processos de control.",
    ...getProjectMedia("TACTE HUMÀ"),
    objectPosition: "50% 50%",
  },
  {
    title: "COLÒNIES DIGITALS",
    authors: ["Míriam Llaquet"],
    year: "2025",
    tipus: "INSTAL·LACIÓ INTERACTIVA",
    duracio: "",
    format: "INSTAL·LACIÓ / ARDUINO",
    tags: ["BIOLOGIA", "TECNOLOGIA", "MICROSCÒPIC"],
    category: "COMMERCIAL",
    program: "LABORATORI DE CREACIONS ARTISTIQUES",
    description: "Colònies Digitals explora la relació invisible entre biologia i tecnologia a través de bacteris presents en dispositius quotidians com mòbils, teclats i ordinadors. Mitjançant plaques de Petri, llum LED i interacció amb Arduino, l'obra revela allò microscòpic que normalment passa desapercebut, convertint la presència humana en l'activadora d'un arxiu viu entre laboratori, instal·lació i ecosistema digital.",
    ...getProjectMedia("COLÒNIES DIGITALS"),
    objectPosition: "50% 50%",
  },
  {
    title: "MORUS ALBA",
    authors: ["Sònia Soldevila"],
    year: "2025",
    tipus: "PROJECTE D'ART DIGITAL",
    duracio: "",
    format: "ESTAMPACIÓ / MIDI / SO",
    tags: ["NATURA", "SO", "TRADUCCIÓ"],
    category: "COMMERCIAL",
    program: "LABORATORI DE CREACIONS ARTISTIQUES",
    description: "Morus Alba transforma les cicatrius i textures d'una morera blanca en llenguatge sonor. A través de l'estampació amb coure i la traducció digital de les formes a MIDI, l'obra converteix la memòria física de l'arbre en una composició experimental. La peça reflexiona sobre la relació entre natura i tecnologia, proposant una manera alternativa d'escoltar el paisatge. Les marques de l'escorça deixen de ser només matèria i es converteixen en informació, ritme i ressonància. El projecte reivindica una escolta més lenta i sensible de la natura, posant en valor allò que sovint passa desapercebut.",
    ...getProjectMedia("MORUS ALBA"),
    objectPosition: "50% 50%",
  },
  {
    title: "RAIGS DE SEQUERA",
    authors: ["Colau Sabater"],
    year: "2025",
    tipus: "INSTAL·LACIÓ INTERACTIVA",
    duracio: "",
    format: "INSTAL·LACIÓ / ARDUINO",
    tags: ["SEQUERA", "AIGUA", "NATURA"],
    category: "COMMERCIAL",
    program: "LABORATORI DE CREACIONS ARTISTIQUES",
    description: "Raigs de Sequera és una instal·lació interactiva que reflexiona sobre l'impacte humà en la natura a través de la dualitat entre l'aigua i la sequera. L'obra combina argila natural esquerdada amb una projecció digital de reflexos d'aigua que desapareix quan l'espectador s'apropa, revelant les esquerdes del suport. Mitjançant Arduino, un sensor de distància i TouchDesigner, la peça mostra com la presència humana pot alterar i deteriorar els ecosistemes, unint materials naturals i tecnologia en una experiència visual i contemplativa.",
    ...getProjectMedia("RAIGS DE SEQUERA"),
    objectPosition: "50% 50%",
  },
  {
    title: "TEMPS INSCRIT",
    authors: ["Berta Güell"],
    year: "2025",
    tipus: "PROJECTE D'ART DIGITAL",
    duracio: "",
    format: "BIOART / JOIERIA / DISSENY GENERATIU",
    tags: ["BIOART", "DADES", "TEMPS"],
    category: "COMMERCIAL",
    program: "LABORATORI DE CREACIONS ARTISTIQUES",
    description: "Temps inscrit és un projecte situat entre el bioart, el disseny generatiu i la joieria contemporània. Durant 17 dies es van registrar el pes i la temperatura interior de tres organismes en procés de descomposició — poma, pera i plàtan — amb l'objectiu de transformar aquestes dades en llenguatge visual. A partir d'un sistema generatiu basat en anelles i deformacions orgàniques, les dades es converteixen en patrons gravats sobre acer inoxidable, materialitzant el pas del temps en forma de joia.",
    ...getProjectMedia("TEMPS INSCRIT"),
    objectPosition: "50% 50%",
  },
];

export const WORK_FILTERS = [
  "ART I CULTURA DIGITAL",
  "LABORATORI DE CREACIONS ARTISTIQUES",
];

export const PROGRAM_SEPARATORS = {
  "ART I CULTURA DIGITAL": {
    titleLines: ["PROJECTES", "TREPAT"],
    subtitle: "ART i Cultura Digital"
  },
  "LABORATORI DE CREACIONS ARTISTIQUES": {
    titleLines: ["PROJECTES", "D'ART DIGITAL"],
    subtitle: "Laboratori per a creacions artístiques"
  },
};
