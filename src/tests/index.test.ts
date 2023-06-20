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
    const welcomePluginInstance = vitePluginSymfony() as any;

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
              js: ["/build/assets/welcome-1e67239d.js"],
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
    const pageAssetsPluginInstance = vitePluginSymfony() as any;
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
              assets: ["/build/assets/logo-d015cc3f.png"],
              css: ["/build/assets/index-aa7c8190.css"],
              js: ["/build/assets/pageAssets-05cfe79c.js"],
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
    const pageImportsPluginInstance = vitePluginSymfony() as any;
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
              js: ["/build/assets/pageImports-53eb9fd1.js"],
              legacy: false,
              preload: ["/build/assets/async-dep-e2ac9f96.js"],
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
    const themePluginInstance = vitePluginSymfony() as any;
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
              css: ["/build/assets/theme-44b5be96.css"],
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

  it("generate correct legacy build entrypoints", ({ expect }) => {
    const legacyPluginInstance = vitePluginSymfony() as any;
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
              js: ["/build/assets/welcome-legacy-64979d13.js"],
              legacy: false,
              preload: [],
            },
            welcome: {
              assets: [],
              css: [],
              js: ["/build/assets/welcome-1e67239d.js"],
              legacy: "welcome-legacy",
              preload: [],
            },
            "polyfills-legacy": {
              assets: [],
              css: [],
              js: ["/build/assets/polyfills-legacy-40963d34.js"],
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
