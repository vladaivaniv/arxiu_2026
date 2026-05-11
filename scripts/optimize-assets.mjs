#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_ASSETS_DIR = path.join(ROOT_DIR, "assets");
const OPTIMIZED_DIR_NAME = "optimized";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXTENSIONS = new Set([".mov", ".mp4", ".m4v", ".webm"]);

const DEFAULT_OPTIONS = {
  assetsDir: DEFAULT_ASSETS_DIR,
  force: false,
  dryRun: false,
  keepAudio: false,
  imageQuality: 78,
  maxImageSize: 1600,
  videoCrf: 26,
  videoFps: 24,
  maxVideoSize: 1280,
  videoPosterAt: 0.5,
};

function printHelp() {
  console.log(`
Optimitza fotos i videos dins de cada carpeta d'assets.

Usage:
  npm run optimize:assets
  npm run optimize:assets -- --force
  npm run optimize:assets -- --dry-run

Options:
  --assets-dir=<path>       Carpeta d'assets. Default: ./assets
  --force                   Regenera fitxers encara que ja existeixin.
  --dry-run                 Mostra que faria sense escriure fitxers.
  --keep-audio              Conserva audio als MP4 optimitzats.
  --image-quality=<1-100>   Qualitat WebP. Default: 78
  --max-image-size=<px>     Mida maxima del costat llarg de les fotos. Default: 1600
  --video-crf=<0-51>        Qualitat H.264; mes alt = menys pes. Default: 26
  --video-fps=<fps>         FPS dels videos optimitzats. Default: 24
  --max-video-size=<px>     Mida maxima del costat llarg dels videos. Default: 1280
  --video-poster-at=<sec>   Segon des d'on extreure la miniatura. Default: 0.5
`);
}

function parseNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseArgs(argv) {
  const options = { ...DEFAULT_OPTIONS };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--keep-audio") {
      options.keepAudio = true;
      continue;
    }

    const [name, value] = arg.split("=");
    if (!value) {
      throw new Error(`Opcio desconeguda: ${arg}`);
    }

    if (name === "--assets-dir") {
      options.assetsDir = path.resolve(value);
    } else if (name === "--image-quality") {
      options.imageQuality = parseNumber(value, options.imageQuality);
    } else if (name === "--max-image-size") {
      options.maxImageSize = parseNumber(value, options.maxImageSize);
    } else if (name === "--video-crf") {
      options.videoCrf = parseNumber(value, options.videoCrf);
    } else if (name === "--video-fps") {
      options.videoFps = parseNumber(value, options.videoFps);
    } else if (name === "--max-video-size") {
      options.maxVideoSize = parseNumber(value, options.maxVideoSize);
    } else if (name === "--video-poster-at") {
      options.videoPosterAt = Number.parseFloat(value) || options.videoPosterAt;
    } else {
      throw new Error(`Opcio desconeguda: ${name}`);
    }
  }

  return options;
}

function assertFfmpegAvailable() {
  const result = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });

  if (result.status !== 0) {
    throw new Error(
      "No s'ha trobat ffmpeg. Instal.la'l amb `brew install ffmpeg` i torna a executar el script.",
    );
  }
}

function getFfmpegCapabilities() {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-encoders"], {
    encoding: "utf8",
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  return {
    supportsWebp: /(?:^|\n)\s*V\S*\s+(?:libwebp|webp)\s/m.test(output),
    supportsJpeg: /(?:^|\n)\s*V\S*\s+mjpeg\s/m.test(output),
  };
}

function isHidden(name) {
  return name.startsWith(".");
}

function getExtension(filePath) {
  return path.extname(filePath).toLowerCase();
}

function isMediaFile(filePath) {
  const extension = getExtension(filePath);
  return IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension);
}

function getOutputName(inputPath, projectDir, extension) {
  const relative = path.relative(projectDir, inputPath);
  const parsed = path.parse(relative);
  const base = path.join(parsed.dir, parsed.name).split(path.sep).join("__");
  return `${base}.optimized${extension}`;
}

function buildScaleFilter(maxSize) {
  return [
    `scale=w=if(gt(iw\\,ih)\\,min(${maxSize}\\,iw)\\,-2):h=if(gt(iw\\,ih)\\,-2\\,min(${maxSize}\\,ih))`,
    "setsar=1",
  ].join(",");
}

function getVideoPosterPath(videoOutputPath) {
  const parsed = path.parse(videoOutputPath);
  return path.join(parsed.dir, `${parsed.name}.poster.jpg`);
}

async function walkMediaFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (isHidden(entry.name) || entry.name === OPTIMIZED_DIR_NAME) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walkMediaFiles(fullPath));
    } else if (entry.isFile() && isMediaFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function getProjectDirs(assetsDir) {
  const entries = await readdir(assetsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory() && !isHidden(entry.name))
    .map((entry) => path.join(assetsDir, entry.name));
}

async function shouldSkipOutput(inputPath, outputPath, force) {
  if (force) {
    return false;
  }

  try {
    const [inputStats, outputStats] = await Promise.all([
      stat(inputPath),
      stat(outputPath),
    ]);

    return outputStats.mtimeMs >= inputStats.mtimeMs;
  } catch {
    return false;
  }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `ffmpeg ha acabat amb codi ${code}`));
    });
  });
}

function imageArgs(inputPath, outputPath, options) {
  if (options.imageCodec === "webp") {
    return [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      inputPath,
      "-vf",
      buildScaleFilter(options.maxImageSize),
      "-frames:v",
      "1",
      "-c:v",
      "libwebp",
      "-quality",
      String(options.imageQuality),
      outputPath,
    ];
  }

  const jpegQuality = Math.max(
    2,
    Math.min(31, Math.round((100 - options.imageQuality) / 3.2)),
  );

  return [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    inputPath,
    "-vf",
    buildScaleFilter(options.maxImageSize),
    "-frames:v",
    "1",
    "-c:v",
    "mjpeg",
    "-q:v",
    String(jpegQuality),
    outputPath,
  ];
}

function videoArgs(inputPath, outputPath, options) {
  const audioArgs = options.keepAudio
    ? ["-c:a", "aac", "-b:a", "128k"]
    : ["-an"];

  return [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    ...audioArgs,
    "-vf",
    `${buildScaleFilter(options.maxVideoSize)},fps=${options.videoFps},format=yuv420p`,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    String(options.videoCrf),
    "-movflags",
    "+faststart",
    outputPath,
  ];
}

function videoPosterArgs(inputPath, outputPath, options) {
  return [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-ss",
    String(options.videoPosterAt),
    "-i",
    inputPath,
    "-frames:v",
    "1",
    "-vf",
    buildScaleFilter(Math.min(options.maxVideoSize, 1200)),
    "-c:v",
    "mjpeg",
    "-q:v",
    "3",
    outputPath,
  ];
}

async function fileSize(filePath) {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** index);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

async function optimizeFile(inputPath, projectDir, options) {
  const extension = getExtension(inputPath);
  const isVideo = VIDEO_EXTENSIONS.has(extension);
  const outputExtension = isVideo ? ".mp4" : options.imageOutputExtension;
  const optimizedDir = path.join(projectDir, OPTIMIZED_DIR_NAME);
  const outputPath = path.join(
    optimizedDir,
    getOutputName(inputPath, projectDir, outputExtension),
  );
  const posterPath = isVideo ? getVideoPosterPath(outputPath) : null;

  const shouldSkipMainOutput = await shouldSkipOutput(inputPath, outputPath, options.force);
  const shouldSkipPosterOutput = posterPath
    ? await shouldSkipOutput(inputPath, posterPath, options.force)
    : true;

  if (shouldSkipMainOutput && shouldSkipPosterOutput) {
    return { status: "skipped", inputPath, outputPath, posterPath };
  }

  if (options.dryRun) {
    return { status: "planned", inputPath, outputPath, posterPath };
  }

  await mkdir(optimizedDir, { recursive: true });

  if (!shouldSkipMainOutput) {
    const args = isVideo
      ? videoArgs(inputPath, outputPath, options)
      : imageArgs(inputPath, outputPath, options);

    await runFfmpeg(args);
  }

  if (isVideo && posterPath && !shouldSkipPosterOutput) {
    await runFfmpeg(videoPosterArgs(inputPath, posterPath, options));
  }

  return {
    status: "optimized",
    inputPath,
    outputPath,
    posterPath,
    inputSize: await fileSize(inputPath),
    outputSize: await fileSize(outputPath),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.dryRun) {
    assertFfmpegAvailable();
  }

  const capabilities = getFfmpegCapabilities();

  if (capabilities.supportsWebp) {
    options.imageCodec = "webp";
    options.imageOutputExtension = ".webp";
  } else if (capabilities.supportsJpeg) {
    options.imageCodec = "jpeg";
    options.imageOutputExtension = ".jpg";
    console.log("ffmpeg no te encoder WebP; les fotos es generaran com a JPG optimitzat.");
  } else if (options.dryRun) {
    options.imageCodec = "webp";
    options.imageOutputExtension = ".webp";
  } else {
    throw new Error("Aquest ffmpeg no pot generar ni WebP ni JPG optimitzat.");
  }

  const projectDirs = await getProjectDirs(options.assetsDir);
  const results = [];

  for (const projectDir of projectDirs) {
    const files = await walkMediaFiles(projectDir);

    for (const inputPath of files) {
      const relativeInput = path.relative(options.assetsDir, inputPath);
      process.stdout.write(`> ${relativeInput}\n`);
      results.push(await optimizeFile(inputPath, projectDir, options));
    }
  }

  const optimized = results.filter((result) => result.status === "optimized");
  const skipped = results.filter((result) => result.status === "skipped");
  const planned = results.filter((result) => result.status === "planned");
  const savedBytes = optimized.reduce((total, result) => {
    return total + Math.max(0, result.inputSize - result.outputSize);
  }, 0);

  for (const result of optimized) {
    const from = path.relative(options.assetsDir, result.inputPath);
    const to = path.relative(options.assetsDir, result.outputPath);
    const poster = result.posterPath
      ? ` + ${path.relative(options.assetsDir, result.posterPath)}`
      : "";
    console.log(
      `OK ${from} -> ${to}${poster} (${formatBytes(result.inputSize)} -> ${formatBytes(result.outputSize)})`,
    );
  }

  for (const result of planned) {
    console.log(
      `DRY ${path.relative(options.assetsDir, result.inputPath)} -> ${path.relative(options.assetsDir, result.outputPath)}${result.posterPath ? ` + ${path.relative(options.assetsDir, result.posterPath)}` : ""}`,
    );
  }

  console.log("");
  console.log(`Optimitzats: ${optimized.length}`);
  console.log(`Ja existien: ${skipped.length}`);
  console.log(`Planificats: ${planned.length}`);
  console.log(`Estalvi aproximat: ${formatBytes(savedBytes)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
