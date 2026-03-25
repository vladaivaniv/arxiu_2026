import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function getGithubPagesBase() {
  const repositorySlug = process.env.GITHUB_REPOSITORY;
  if (!repositorySlug) {
    return "/";
  }

  const [, repositoryName] = repositorySlug.split("/");
  if (!repositoryName || repositoryName.endsWith(".github.io")) {
    return "/";
  }

  return `/${repositoryName}/`;
}

export default defineConfig({
  base: getGithubPagesBase(),
  plugins: [react()],
});
