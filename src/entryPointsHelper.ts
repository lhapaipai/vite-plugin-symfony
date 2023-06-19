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

  /** get an Array of entryPoints from build.rollupOptions.input inside vite config file  */
  const entryFiles = prepareRollupInputs(viteConfig);
  let hasLegacyEntries = false;
  for (const [entryName, entry] of Object.entries(entryFiles)) {
    const outputRelPath = inputRelPath2outputRelPath[entry.inputRelPath];
    const fileInfos = generatedFiles[outputRelPath];

    if (!outputRelPath || !fileInfos) {
      console.error("unable to map generatedFile", entry, outputRelPath, fileInfos, inputRelPath2outputRelPath);
    }

    const legacyEntryPath = getLegacyName(entry.inputRelPath);
    const legacyOutputRelPath = inputRelPath2outputRelPath[legacyEntryPath];
    const legacyFileInfos = generatedFiles[legacyOutputRelPath];

    const legacyEntryName = `${entryName}-legacy`;

    entryPoints[entryName] = resolveEntrypoint(
      fileInfos,
      generatedFiles,
      viteConfig,
      legacyFileInfos ? legacyEntryName : false,
      true,
    );
    if (legacyFileInfos) {
      hasLegacyEntries = true;
      entryPoints[legacyEntryName] = resolveEntrypoint(legacyFileInfos, generatedFiles, viteConfig, false, true);
    }
  }

  if (hasLegacyEntries && inputRelPath2outputRelPath["vite/legacy-polyfills"]) {
    const fileInfos = generatedFiles[inputRelPath2outputRelPath["vite/legacy-polyfills"]];
    if (fileInfos) {
      entryPoints["polyfills-legacy"] = resolveEntrypoint(fileInfos, generatedFiles, viteConfig, false, true);
    }
  }

  return entryPoints;
};

export const resolveEntrypoint = (
  fileInfos: FileInfos,
  generatedFiles: GeneratedFiles,
  config: ResolvedConfig,
  legacyEntryName: boolean | string,
  isEntryPoint: boolean,
): EntryPoint => {
  const js: string[] = [];
  const css: string[] = [];
  const preload: string[] = [];

  if (fileInfos.type === "js") {
    for (const importEntryName of fileInfos.imports) {
      const importFileInfos = generatedFiles[importEntryName];
      if (!importFileInfos) {
        throw new Error(`Unable to find ${importEntryName}`);
      }
      const { css: importCss, preload: importPreload } = resolveEntrypoint(
        importFileInfos,
        generatedFiles,
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

  const filePath = `${config.base}${fileInfos.outputRelPath}`;

  if (isEntryPoint) {
    if (fileInfos.type === "js") {
      js.push(filePath);
    } else {
      css.push(filePath);
    }
  } else if (preload.indexOf(filePath) === -1) {
    preload.push(filePath);
  }

  fileInfos.css.forEach((cssFilePath) => {
    css.push(`${config.base}${cssFilePath}`);
  });

  return { css, js, legacy: legacyEntryName, preload };
};
