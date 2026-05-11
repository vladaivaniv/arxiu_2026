import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const docsDir = path.join(rootDir, "docs");

const deployEntriesToClear = [
  "assets",
  "index.html",
  ".nojekyll",
  "logo-ddtec-blanc.png",
  "vista_generica_museu.jpg",
];

async function pathExists(targetPath) {
  try {
    await readdir(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function clearPreviousDeploy() {
  for (const entry of deployEntriesToClear) {
    await rm(path.join(docsDir, entry), { recursive: true, force: true });
  }
}

async function copyDistToDocs() {
  const hasDist = await pathExists(distDir);

  if (!hasDist) {
    throw new Error("No s'ha trobat la carpeta dist. Executa primer `vite build`.");
  }

  await mkdir(docsDir, { recursive: true });
  await clearPreviousDeploy();
  await cp(distDir, docsDir, { recursive: true });
}

copyDistToDocs().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
