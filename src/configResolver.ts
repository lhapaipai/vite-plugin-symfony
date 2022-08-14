import { cwd } from "process";
import { resolve, extname } from "path";
import type { ResolvedConfig } from "vite";

const getDevEntryPoints = (config: ResolvedConfig) => {
  const entryPoints: EntryPoints = {};
  const { origin } = config.server;

  for (const [entryName, { entryPath, entryType }] of Object.entries(parseInput(config))) {
    entryPoints[entryName] = {
      [entryType]: [`${origin}${config.base}${entryPath}`],
    };
  }
  return entryPoints;
};

const getBuildEntryPoints = (config: ResolvedConfig, manifest: Manifest) => {
  const entryPoints: EntryPoints = {};

  for (const [entryName, entry] of Object.entries(parseInput(config))) {
    entryPoints[entryName] = parseManifestEntry(entry, manifest, config);
  }

  return entryPoints;
};

const parseManifestEntry = ({ entryPath, entryType }: ParsedEntry, manifest: Manifest, config: ResolvedConfig) => {
  if (!manifest[entryPath]) {
    throw new Error(`Entrypoint ${entryPath} not defined in the manifest`);
  }
  const manifestEntry = manifest[entryPath];

  const js: string[] = [];
  const css: string[] = [];
  const preload: string[] = [];

  if (manifestEntry.imports) {
    for (const importEntryName of manifestEntry.imports) {
      const { css: importCss, preload: importPreload } = parseManifestEntry(
        {
          entryPath: importEntryName,
          entryType: "js",
        },
        manifest,
        config,
      );

      for (const dependency of importCss) {
        if (css.indexOf(dependency) === -1) {
          css.push(dependency);
        }
      }
      for (const dependency of importPreload) {
        if (preload.indexOf(dependency) === -1) {
          preload.push(dependency);
        }
      }
    }
  }

  if (manifestEntry.isEntry) {
    if (entryType === "js") {
      js.push(`${config.base}${manifestEntry.file}`);
    } else if (entryType === "css") {
      css.push(`${config.base}${manifestEntry.file}`);
    }
  } else if (preload.indexOf(`${config.base}${manifestEntry.file}`) === -1) {
    preload.push(`${config.base}${manifestEntry.file}`);
  }

  if (manifestEntry.css) {
    manifestEntry.css.forEach((cssEntry) => {
      if (css.indexOf(`${config.base}${cssEntry}`) === -1) {
        css.push(`${config.base}${cssEntry}`);
      }
    });
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

    const extension = extname(entryPath);

    const entryType =
      [".css", ".scss", ".sass", ".less", ".styl", ".stylus", ".postcss"].indexOf(extension) !== -1 ? "css" : "js";

    const entryRelativePath = entryAbsolutePath.substring(config.root.length + 1);

    inputParsed[entryName] = {
      entryType,
      entryPath: entryRelativePath,
    };
  }

  return inputParsed;
};

export { getDevEntryPoints, getBuildEntryPoints };
