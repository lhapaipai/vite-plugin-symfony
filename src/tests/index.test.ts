import { describe, it, vi } from "vitest";

import vitePluginSymfony from "../index";
import type { OutputChunk, OutputAsset } from "rollup";
import { type Plugin } from "vite";

import {
  viteBaseConfig,
  asyncDepChunk,
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
  it("generate correct build entrypoints", ({ expect }) => {
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
            welcome: {
              css: [],
              js: ["/build/assets/welcome-1e67239d.js"],
              legacy: "welcome-legacy",
              preload: [],
            },
            "welcome-legacy": {
              css: [],
              js: ["/build/assets/welcome-legacy-64979d13.js"],
              legacy: false,
              preload: [],
            },
            "polyfills-legacy": {
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
