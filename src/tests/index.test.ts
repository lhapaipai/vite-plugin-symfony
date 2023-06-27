import { describe, it, vi } from "vitest";

import vitePluginSymfony from "../index";
import type { OutputChunk, OutputAsset } from "rollup";

import {
  viteBaseConfig,
  asyncDepChunk,
  pageImports,
  indexCss,
  themeScssChunk,
  themeCss,
  welcomeJs,
  welcomeLegacyJs,
  legacyPolyfills,
  pageAssets,
  logoPng,
  circular1Js,
  circular2Js,
} from "./mocks";

function createBundleObject(files: (OutputChunk | OutputAsset)[]) {
  const bundles: {
    [fileName: string]: OutputChunk | OutputAsset;
  } = {};
  files.forEach((file) => {
    bundles[file.fileName] = file;
  });

  return bundles;
}

describe("vitePluginSymfony", () => {
  it("generate correct welcome build entrypoints", ({ expect }) => {
    const welcomePluginInstance = vitePluginSymfony({ debug: true }) as any;

    welcomePluginInstance.emitFile = vi.fn();
    welcomePluginInstance.configResolved({
      ...viteBaseConfig,
      build: {
        rollupOptions: {
          input: {
            welcome: "./assets/page/welcome/index.js",
          },
        },
      },
    });
    welcomePluginInstance.generateBundle({ format: "es" }, createBundleObject([welcomeJs]));

    expect(welcomePluginInstance.emitFile).toHaveBeenCalledWith({
      fileName: "entrypoints.json",
      source: JSON.stringify(
        {
          entryPoints: {
            welcome: {
              assets: [],
              css: [],
              js: [
                {
                  path: "/build/assets/welcome-1e67239d.js",
                  hash: null,
                },
              ],
              legacy: false,
              preload: [],
            },
          },
          isProd: true,
          legacy: false,
          viteServer: false,
        },
        null,
        2,
      ),
      type: "asset",
    });
  });

  it("generate correct integrity hash for build entrypoints", ({ expect }) => {
    const hashPluginInstance = vitePluginSymfony({ debug: true, sriAlgorithm: "sha256" }) as any;

    hashPluginInstance.emitFile = vi.fn();
    hashPluginInstance.configResolved({
      ...viteBaseConfig,
      build: {
        rollupOptions: {
          input: {
            welcome: "./assets/page/welcome/index.js",
          },
        },
      },
    });
    hashPluginInstance.generateBundle({ format: "es" }, createBundleObject([welcomeJs]));

    expect(hashPluginInstance.emitFile).toHaveBeenCalledWith({
      fileName: "entrypoints.json",
      source: JSON.stringify(
        {
          entryPoints: {
            welcome: {
              assets: [],
              css: [],
              js: [
                {
                  path: "/build/assets/welcome-1e67239d.js",
                  hash: "sha256-w+Sit18/MC+LC1iX8MrNapOiCQ8wbPX8Rb6ErbfDX1Q=",
                },
              ],
              legacy: false,
              preload: [],
            },
          },
          isProd: true,
          legacy: false,
          viteServer: false,
        },
        null,
        2,
      ),
      type: "asset",
    });
  });

  it("generate correct pageAssets build entrypoints", ({ expect }) => {
    const pageAssetsPluginInstance = vitePluginSymfony({ debug: true }) as any;
    pageAssetsPluginInstance.emitFile = vi.fn();
    pageAssetsPluginInstance.configResolved({
      ...viteBaseConfig,
      build: {
        rollupOptions: {
          input: {
            pageAssets: "./assets/page/assets/index.js",
          },
        },
      },
    });
    pageAssetsPluginInstance.generateBundle({ format: "es" }, createBundleObject([pageAssets, indexCss, logoPng]));

    expect(pageAssetsPluginInstance.emitFile).toHaveBeenCalledWith({
      fileName: "entrypoints.json",
      source: JSON.stringify(
        {
          entryPoints: {
            pageAssets: {
              assets: [
                {
                  path: "/build/assets/logo-d015cc3f.png",
                  hash: null,
                },
              ],
              css: [
                {
                  path: "/build/assets/index-aa7c8190.css",
                  hash: null,
                },
              ],
              js: [
                {
                  path: "/build/assets/pageAssets-05cfe79c.js",
                  hash: null,
                },
              ],
              legacy: false,
              preload: [],
            },
          },
          isProd: true,
          legacy: false,
          viteServer: false,
        },
        null,
        2,
      ),
      type: "asset",
    });
  });

  it("generate correct pageImports build entrypoints", ({ expect }) => {
    const pageImportsPluginInstance = vitePluginSymfony({ debug: true }) as any;
    pageImportsPluginInstance.emitFile = vi.fn();
    pageImportsPluginInstance.configResolved({
      ...viteBaseConfig,
      build: {
        rollupOptions: {
          input: {
            pageImports: "./assets/page/imports/index.js",
          },
        },
      },
    });
    pageImportsPluginInstance.generateBundle({ format: "es" }, createBundleObject([pageImports, asyncDepChunk]));

    expect(pageImportsPluginInstance.emitFile).toHaveBeenCalledWith({
      fileName: "entrypoints.json",
      source: JSON.stringify(
        {
          entryPoints: {
            pageImports: {
              assets: [],
              css: [],
              js: [
                {
                  path: "/build/assets/pageImports-53eb9fd1.js",
                  hash: null,
                },
              ],
              legacy: false,
              preload: [
                {
                  path: "/build/assets/async-dep-e2ac9f96.js",
                  hash: null,
                },
              ],
            },
          },
          isProd: true,
          legacy: false,
          viteServer: false,
        },
        null,
        2,
      ),
      type: "asset",
    });
  });

  it("generate correct theme build entrypoints", ({ expect }) => {
    const themePluginInstance = vitePluginSymfony({ debug: true }) as any;
    themePluginInstance.emitFile = vi.fn();
    themePluginInstance.configResolved({
      ...viteBaseConfig,
      build: {
        rollupOptions: {
          input: {
            theme: "./assets/theme.scss",
          },
        },
      },
    });

    themePluginInstance.renderChunk("CODE", themeScssChunk);
    themePluginInstance.generateBundle({ format: "es" }, createBundleObject([themeCss]));

    expect(themePluginInstance.emitFile).toHaveBeenCalledWith({
      fileName: "entrypoints.json",
      source: JSON.stringify(
        {
          entryPoints: {
            theme: {
              assets: [],
              css: [
                {
                  path: "/build/assets/theme-44b5be96.css",
                  hash: null,
                },
              ],
              js: [],
              legacy: false,
              preload: [],
            },
          },
          isProd: true,
          legacy: false,
          viteServer: false,
        },
        null,
        2,
      ),
      type: "asset",
    });
  });

  it("generate correct circular build entrypoints", ({ expect }) => {
    const circularPluginInstance = vitePluginSymfony({ debug: true }) as any;
    circularPluginInstance.emitFile = vi.fn();
    circularPluginInstance.configResolved({
      ...viteBaseConfig,
      build: {
        rollupOptions: {
          input: {
            circular: "./assets/page/circular1.js",
          },
        },
      },
    });

    circularPluginInstance.generateBundle({ format: "es" }, createBundleObject([circular1Js, circular2Js]));

    expect(circularPluginInstance.emitFile).toHaveBeenCalledWith({
      fileName: "entrypoints.json",
      source: JSON.stringify(
        {
          entryPoints: {
            circular: {
              assets: [],
              css: [],
              js: [
                {
                  path: "/build/assets/circular1-56785678.js",
                  hash: null,
                },
              ],
              legacy: false,
              preload: [
                {
                  path: "/build/assets/circular2-12341234.js",
                  hash: null,
                },
              ],
            },
          },
          isProd: true,
          legacy: false,
          viteServer: false,
        },
        null,
        2,
      ),
      type: "asset",
    });
  });

  it("generate correct legacy build entrypoints", ({ expect }) => {
    const legacyPluginInstance = vitePluginSymfony({ debug: true }) as any;
    legacyPluginInstance.emitFile = vi.fn();
    legacyPluginInstance.configResolved({
      ...viteBaseConfig,
      build: {
        rollupOptions: {
          input: {
            welcome: "./assets/page/welcome/index.js",
          },
          output: [{ format: "system" }, { format: "es" }],
        },
      },
    });

    legacyPluginInstance.generateBundle({ format: "system" }, createBundleObject([welcomeLegacyJs, legacyPolyfills]));
    legacyPluginInstance.generateBundle({ format: "es" }, createBundleObject([welcomeJs]));

    expect(legacyPluginInstance.emitFile).toHaveBeenCalledWith({
      fileName: "entrypoints.json",
      source: JSON.stringify(
        {
          entryPoints: {
            "welcome-legacy": {
              assets: [],
              css: [],
              js: [
                {
                  path: "/build/assets/welcome-legacy-64979d13.js",
                  hash: null,
                },
              ],
              legacy: false,
              preload: [],
            },
            welcome: {
              assets: [],
              css: [],
              js: [
                {
                  path: "/build/assets/welcome-1e67239d.js",
                  hash: null,
                },
              ],
              legacy: "welcome-legacy",
              preload: [],
            },
            "polyfills-legacy": {
              assets: [],
              css: [],
              js: [
                {
                  path: "/build/assets/polyfills-legacy-40963d34.js",
                  hash: null,
                },
              ],
              legacy: false,
              preload: [],
            },
          },
          isProd: true,
          legacy: true,
          viteServer: false,
        },
        null,
        2,
      ),
      type: "asset",
    });
  });
});
