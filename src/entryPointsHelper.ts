import type { ResolvedConfig } from "vite";
import { getLegacyName, prepareRollupInputs } from "./utils";

export const getDevEntryPoints = (config: ResolvedConfig, viteDevServerUrl: string): EntryPoints => {
  const entryPoints: EntryPoints = {};

  for (const [entryName, { inputRelPath, inputType }] of Object.entries(prepareRollupInputs(config))) {
    entryPoints[entryName] = {
      [inputType]: [`${viteDevServerUrl}${config.base}${inputRelPath}`],
    };
  }
  return entryPoints;
};

export const getBuildEntryPoints = (
  generatedFiles: GeneratedFiles,
  viteConfig: ResolvedConfig,
  inputRelPath2outputRelPath: StringMapping,
): EntryPoints => {
  const entryPoints: EntryPoints = {};
  let hasLegacyEntryPoint = false;

  /** get an Array of entryPoints from build.rollupOptions.input inside vite config file  */
  const entryFiles = prepareRollupInputs(viteConfig);

  for (const [entryName, entry] of Object.entries(entryFiles)) {
    const outputRelPath = inputRelPath2outputRelPath[entry.inputRelPath];
    const fileInfos = generatedFiles[outputRelPath];

    if (!outputRelPath || !fileInfos) {
      console.error("unable to map generatedFile", entry, outputRelPath, fileInfos, inputRelPath2outputRelPath);
      process.exit(1);
    }

    const legacyInputRelPath = getLegacyName(entry.inputRelPath);
    const legacyFileInfos = generatedFiles[inputRelPath2outputRelPath[legacyInputRelPath]] ?? null;

    if (legacyFileInfos) {
      hasLegacyEntryPoint = true;
      entryPoints[`${entryName}-legacy`] = resolveEntrypoint(legacyFileInfos, generatedFiles, viteConfig, false);
    }

    entryPoints[entryName] = resolveEntrypoint(
      fileInfos,
      generatedFiles,
      viteConfig,
      hasLegacyEntryPoint ? `${entryName}-legacy` : false,
    );
  }

  if (hasLegacyEntryPoint && inputRelPath2outputRelPath["vite/legacy-polyfills"]) {
    const fileInfos = generatedFiles[inputRelPath2outputRelPath["vite/legacy-polyfills"]] ?? null;
    if (fileInfos) {
      entryPoints["polyfills-legacy"] = resolveEntrypoint(fileInfos, generatedFiles, viteConfig, false);
    }
  }

  return entryPoints;
};

export const resolveEntrypoint = (
  fileInfos: FileInfos,
  generatedFiles: GeneratedFiles,
  config: ResolvedConfig,
  legacyEntryName: boolean | string,
): EntryPoint => {
  const assets: string[] = [];
  const css: string[] = [];
  const js: string[] = [];
  const preload: string[] = [];

  if (fileInfos.type === "js") {
    for (const importEntryName of fileInfos.imports) {
      const importFileInfos = generatedFiles[importEntryName];
      if (!importFileInfos) {
        throw new Error(`Unable to find ${importEntryName}`);
      }

      const {
        assets: importAssets,
        css: importCss,
        preload: importPreload,
        js: importJs,
      } = resolveEntrypoint(importFileInfos, generatedFiles, config, false);

      for (const dependency of importCss) {
        if (css.indexOf(dependency) === -1) {
          css.push(dependency);
        }
      }
      for (const dependency of importJs) {
        if (js.indexOf(dependency) === -1) {
          js.push(dependency);
        }
      }
      for (const dependency of importPreload) {
        if (preload.indexOf(dependency) === -1) {
          preload.push(dependency);
        }
      }
      for (const dependency of importAssets) {
        if (assets.indexOf(dependency) === -1) {
          assets.push(dependency);
        }
      }
    }

    fileInfos.assets.forEach((assetsFilePath) => {
      assets.push(`${config.base}${assetsFilePath}`);
    });
    fileInfos.js.forEach((jsFilePath) => {
      js.push(`${config.base}${jsFilePath}`);
    });
    fileInfos.preload.forEach((preloadFilePath) => {
      preload.push(`${config.base}${preloadFilePath}`);
    });
  }

  if (fileInfos.type === "js" || fileInfos.type === "css") {
    fileInfos.css.forEach((cssFilePath) => {
      css.push(`${config.base}${cssFilePath}`);
    });
  }

  return { assets, css, js, legacy: legacyEntryName, preload };
};
