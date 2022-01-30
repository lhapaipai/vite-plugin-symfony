import { cwd } from "process";
import { resolve } from "path";
import type { ResolvedConfig } from "vite";

const getDevEntryPoints = (config: ResolvedConfig) => {
  const entryPoints: EntryPoints = {};
  const { origin } = config.server;

  for (const [entryName, entryPath] of Object.entries(parseInput(config))) {
    entryPoints[entryName] = {
      js: [`${origin}${config.base}${entryPath}`],
    };
  }
  return {
    isProd: false,
    viteServer: {
      origin,
      base: config.base,
    },
    entryPoints,
  };
};

const getBuildEntryPoints = (config: ResolvedConfig, manifest: Manifest) => {
  const entryPoints: EntryPoints = {};

  for (const [entryName, entryPath] of Object.entries(parseInput(config))) {
    entryPoints[entryName] = parseManifestEntry(entryPath, manifest, config);
  }

  return {
    isProd: true,
    entryPoints,
  };
};

const parseManifestEntry = (entryPath: string, manifest: Manifest, config: ResolvedConfig) => {
  if (!manifest[entryPath]) {
    throw new Error(`Entrypoint ${entryPath} not defined in the manifest`);
  }
  const manifestEntry = manifest[entryPath];

  const js: string[] = [];
  const css: string[] = [];
  const preload: string[] = [];

  if (manifestEntry.isEntry) {
    js.push(`${config.base}${manifestEntry.file}`);
  } else {
    preload.push(`${config.base}${manifestEntry.file}`);
  }

  if (manifestEntry.css) {
    css.push(`${config.base}${manifestEntry.css}`);
  }

  if (manifestEntry.imports) {
    for (const importEntryName of manifestEntry.imports) {
      const { css: importCss, preload: importPreload } = parseManifestEntry(importEntryName, manifest, config);

      css.push(...importCss);
      preload.push(...importPreload);
    }
  }

  return { js, css, preload };
};

const parseInput = (config: ResolvedConfig) => {
  const inputParsed: ParsedInput = {};

  for (const [entryName, entryPath] of Object.entries(config.build.rollupOptions.input)) {
    const entryAbsolutePath = resolve(cwd(), entryPath).replace(/\\/g, "/");

    if (entryAbsolutePath.indexOf(config.root) !== 0) {
      console.error("Entry points must be inside Vite root directory");
      process.exit(1);
    }

    const entryRelativePath = entryAbsolutePath.substr(config.root.length + 1);

    inputParsed[entryName] = entryRelativePath;
  }

  return inputParsed;
};

export { getDevEntryPoints, getBuildEntryPoints };
