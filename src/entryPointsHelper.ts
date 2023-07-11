import type { ResolvedConfig } from "vite";
import { getLegacyName, prepareRollupInputs } from "./utils";
import { EntryPoints, EntryPoint, StringMapping, GeneratedFiles, FileInfos, FileWithHash } from "./types";

export const getDevEntryPoints = (config: ResolvedConfig, viteDevServerUrl: string): EntryPoints => {
  const entryPoints: EntryPoints = {};

  for (const [entryName, { inputRelPath, inputType }] of Object.entries(prepareRollupInputs(config))) {
    entryPoints[entryName] = {
      [inputType]: [
        {
          path: `${viteDevServerUrl}${config.base}${inputRelPath}`,
          hash: null,
        },
      ],
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
  resolvedImportOutputRelPaths: string[] = [],
): EntryPoint => {
  const assets: FileWithHash[] = [];
  const css: FileWithHash[] = [];
  const js: FileWithHash[] = [];
  const preload: FileWithHash[] = [];
  const dynamic: FileWithHash[] = [];

  resolvedImportOutputRelPaths.push(fileInfos.outputRelPath);

  if (fileInfos.type === "js") {
    for (const importOutputRelPath of fileInfos.imports) {
      if (resolvedImportOutputRelPaths.indexOf(importOutputRelPath) !== -1) {
        continue;
      }
      resolvedImportOutputRelPaths.push(importOutputRelPath);

      const importFileInfos = generatedFiles[importOutputRelPath];
      if (!importFileInfos) {
        throw new Error(`Unable to find ${importOutputRelPath}`);
      }

      const {
        assets: importAssets,
        css: importCss,
        dynamic: importDynamic,
        js: importJs,
        preload: importPreload,
      } = resolveEntrypoint(importFileInfos, generatedFiles, config, false, resolvedImportOutputRelPaths);

      for (const dependencyWithHash of importCss) {
        if (css.findIndex((file) => file.path === dependencyWithHash.path) === -1) {
          css.push(dependencyWithHash);
        }
      }

      // imports are preloaded not js files
      for (const dependencyWithHash of importJs) {
        if (preload.findIndex((file) => file.path === dependencyWithHash.path) === -1) {
          preload.push(dependencyWithHash);
        }
      }
      for (const dependencyWithHash of importPreload) {
        if (preload.findIndex((file) => file.path === dependencyWithHash.path) === -1) {
          preload.push(dependencyWithHash);
        }
      }
      for (const dependencyWithHash of importDynamic) {
        if (dynamic.findIndex((file) => file.path === dependencyWithHash.path) === -1) {
          dynamic.push(dependencyWithHash);
        }
      }
      for (const dependencyWithHash of importAssets) {
        if (assets.findIndex((file) => file.path === dependencyWithHash.path) === -1) {
          assets.push(dependencyWithHash);
        }
      }
    }

    fileInfos.assets.forEach((dependency) => {
      if (assets.findIndex((file) => file.path === dependency) === -1) {
        assets.push({
          path: `${config.base}${dependency}`,
          hash: generatedFiles[dependency].hash,
        });
      }
    });
    fileInfos.js.forEach((dependency) => {
      if (js.findIndex((file) => file.path === dependency) === -1) {
        js.push({
          path: `${config.base}${dependency}`,
          hash: generatedFiles[dependency].hash,
        });
      }
    });
    fileInfos.preload.forEach((dependency) => {
      if (preload.findIndex((file) => file.path === dependency) === -1) {
        preload.push({
          path: `${config.base}${dependency}`,
          hash: generatedFiles[dependency].hash,
        });
      }
    });
    fileInfos.dynamic.forEach((dependency) => {
      if (dynamic.findIndex((file) => file.path === dependency) === -1) {
        dynamic.push({
          path: `${config.base}${dependency}`,
          hash: generatedFiles[dependency].hash,
        });
      }
    });
  }

  if (fileInfos.type === "js" || fileInfos.type === "css") {
    fileInfos.css.forEach((dependency) => {
      if (css.findIndex((file) => file.path === dependency) === -1) {
        css.push({
          path: `${config.base}${dependency}`,
          hash: generatedFiles[dependency].hash,
        });
      }
    });
  }

  return { assets, css, dynamic, js, legacy: legacyEntryName, preload };
};
