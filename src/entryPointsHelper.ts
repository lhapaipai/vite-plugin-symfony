import { cwd } from "process";
import { resolve, extname } from "path";
import type { ResolvedConfig } from "vite";
import type { OutputBundle, OutputChunk, OutputAsset, NormalizedOutputOptions } from "rollup";
import { normalizePath, getLegacyName } from "./utils";
import path from "node:path";

export const entryPath2exportPath: StringMapping = {};

export const getDevEntryPoints = (config: ResolvedConfig, viteDevServerUrl: string): EntryPoints => {
  const entryPoints: EntryPoints = {};

  for (const [entryName, { entryPath, entryType }] of Object.entries(prepareRollupInputs(config))) {
    entryPoints[entryName] = {
      [entryType]: [`${viteDevServerUrl}${config.base}${entryPath}`],
    };
  }
  return entryPoints;
};

export const addBuildEntryPoints = (
  options: NormalizedOutputOptions,
  config: ResolvedConfig,
  bundle: OutputBundle,
  entryPoints: EntryPoints,
): EntryPoints => {
  for (const chunkName in bundle) {
    entryPath2exportPath[getEntryPath(bundle[chunkName], options, config)] = chunkName;
  }

  /** get an Array of entryPoints from build.rollupOptions.input inside vite config file  */
  const entryFiles = prepareRollupInputs(config);
  for (const [entryName, entry] of Object.entries(entryFiles)) {
    let exportPath = entryPath2exportPath[entry.entryPath];
    let fileInfos = <OutputChunk & { viteMetadata: ChunkMetadata }>bundle[exportPath];
    let isLegacy = false;
    if (!fileInfos) {
      const legacyEntryPath = getLegacyName(entry.entryPath);
      exportPath = entryPath2exportPath[legacyEntryPath];
      fileInfos = <OutputChunk & { viteMetadata: ChunkMetadata }>bundle[exportPath];
      if (!fileInfos) {
        // for entry points that don't need polyfill files (ex: css entryType), no file was generated
        continue;
      }
      isLegacy = true;
    }

    const defaultEntryName = isLegacy ? `${entryName}-legacy` : entryName;
    /** legacy entryPoints are generated before default entryPoints, we can also check if each default
     * entryPoint has his legacy entryPoint
     */
    const legacyEntryName =
      typeof entryPoints[`${defaultEntryName}-legacy`] !== "undefined" ? `${defaultEntryName}-legacy` : false;

    entryPoints[defaultEntryName] = resolveEntrypoint(fileInfos, bundle, config, legacyEntryName, true);
  }

  if (entryPath2exportPath["vite/legacy-polyfills-legacy"]) {
    const fileInfos = <OutputChunk & { viteMetadata: ChunkMetadata }>(
      bundle[entryPath2exportPath["vite/legacy-polyfills-legacy"]]
    );
    if (fileInfos) {
      entryPoints["polyfills-legacy"] = resolveEntrypoint(fileInfos, bundle, config, false, true);
    }
  }

  return entryPoints;
};

const getEntryPath = (
  chunk: OutputAsset | OutputChunk,
  options: NormalizedOutputOptions,
  config: ResolvedConfig,
): string => {
  if (chunk.type === "asset") {
    /**
     *  chunk = { -> image/font/css files
     *    fileName: 'assets/logo-d12344321.png' or 'assets/theme-d12344321.css'
     *    name: 'logo.png',                     or 'theme.css'
     *    type: 'asset',                        or 'asset'
     *    source: <Buffer>                      or <string>
     *  }
     */
    return chunk.name;
  } else if (chunk.type === "chunk") {
    /**
     * chunk = { -> js files
     *   code: <string>,
     *   facadeModuleId: '/path-to-project/assets/welcome-12341234.js',
     *   fileName: 'assets/welcome-12341234.js',
     *   name: 'welcome',
     *   type: 'chunk',
     *   viteMetadata: {
     *     importedAssets: <Set>,
     *     importedCss: <Set>
     *   }
     * }
     */

    if (chunk.facadeModuleId) {
      let name = normalizePath(path.relative(config.root, chunk.facadeModuleId));

      /* when we generate legacy files, format === 'system'. after format is other value like 'es' */
      if (options.format === "system" && !chunk.name.includes("-legacy")) {
        name = getLegacyName(name);
      }
      return name.replace(/\0/g, "");
    } else {
      return chunk.fileName;
    }
  }
};

const resolveEntrypoint = (
  fileInfos: OutputChunk & { viteMetadata: ChunkMetadata },
  bundle: OutputBundle,
  config: ResolvedConfig,
  legacyEntryName: boolean | string,
  isCSSOrJsEntry: boolean,
): EntryPoint => {
  const js: string[] = [];
  const css: string[] = [];
  const preload: string[] = [];

  if (fileInfos.imports) {
    for (const importEntryName of fileInfos.imports) {
      const importFileInfos = <OutputChunk & { viteMetadata: ChunkMetadata }>bundle[importEntryName];
      if (!importFileInfos) {
        throw new Error(`Unable to find ${importEntryName}`);
      }
      const { css: importCss, preload: importPreload } = resolveEntrypoint(
        importFileInfos,
        bundle,
        config,
        false,
        false,
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

  const filePath = `${config.base}${fileInfos.fileName}`;

  if (isCSSOrJsEntry) {
    if (fileInfos.isEntry) {
      // it is a JS file
      js.push(filePath);
    } else {
      css.push(filePath);
    }
  } else if (preload.indexOf(filePath) === -1) {
    preload.push(filePath);
  }

  if (fileInfos.viteMetadata?.importedCss.size) {
    fileInfos.viteMetadata.importedCss.forEach((cssFilePath) => {
      css.push(`${config.base}${cssFilePath}`);
    });
  }
  return { js, css, preload, legacy: legacyEntryName };
};

const prepareRollupInputs = (config: ResolvedConfig): ParsedInputs => {
  const inputParsed: ParsedInputs = {};

  for (const [entryName, entryPath] of Object.entries(config.build.rollupOptions.input)) {
    const entryAbsolutePath = normalizePath(resolve(cwd(), entryPath));

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
