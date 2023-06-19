import { describe, it } from "vitest";
import { getLegacyName, normalizePath, getFileInfos, getInputRelPath, prepareRollupInputs } from "../utils";
import { OutputChunk, OutputAsset, NormalizedOutputOptions } from "rollup";
import {
  asyncDepChunk,
  indexCss,
  legacyPolyfills,
  logoPng,
  pageAssets,
  themeCss,
  welcomeJs,
  welcomeLegacyJs,
} from "./mocks";
import type { ResolvedConfig } from "vite";

const viteBaseConfig = {
  root: "/home/me/project-dir",
  base: "/build/",
} as unknown as ResolvedConfig;

describe("normalizePath", () => {
  it("keep the path unchanged on UNIX", ({ expect }) => {
    expect(normalizePath("path/to/file.ts")).toBe("path/to/file.ts");
  });
});

describe("getLegacyName", () => {
  it("suffix pathname with -legacy before extension", ({ expect }) => {
    expect(getLegacyName("assets/page/assets/index.js")).toBe("assets/page/assets/index-legacy.js");
  });
});

describe("getFileInfos", () => {
  it("parse correctly an output", ({ expect }) => {
    expect(getFileInfos(asyncDepChunk, "assets/lib/async-dep.js")).toMatchInlineSnapshot(`
      {
        "css": [],
        "imports": [],
        "inputRelPath": "assets/lib/async-dep.js",
        "outputRelPath": "assets/async-dep-e2ac9f96.js",
        "preload": [],
        "type": "js",
      }
    `);
    expect(getFileInfos(indexCss, "_assets/index-aa7c8190.css")).toMatchInlineSnapshot(`
      {
        "css": [],
        "imports": [],
        "inputRelPath": "_assets/index-aa7c8190.css",
        "outputRelPath": "assets/index-aa7c8190.css",
        "preload": [],
        "type": "asset",
      }
    `);
    expect(getFileInfos(themeCss, "assets/theme.scss")).toMatchInlineSnapshot(`
      {
        "css": [],
        "imports": [],
        "inputRelPath": "assets/theme.scss",
        "outputRelPath": "assets/theme-44b5be96.css",
        "preload": [],
        "type": "css",
      }
    `);
    expect(getFileInfos(logoPng, "_assets/logo-d015cc3f.png")).toMatchInlineSnapshot(`
      {
        "css": [],
        "imports": [],
        "inputRelPath": "_assets/logo-d015cc3f.png",
        "outputRelPath": "assets/logo-d015cc3f.png",
        "preload": [],
        "type": "asset",
      }
    `);
    expect(getFileInfos(welcomeJs, "assets/page/welcome/index.js")).toMatchInlineSnapshot(`
      {
        "css": [],
        "imports": [],
        "inputRelPath": "assets/page/welcome/index.js",
        "outputRelPath": "assets/welcome-1e67239d.js",
        "preload": [],
        "type": "js",
      }
    `);
    expect(getFileInfos(pageAssets, "assets/page/assets/index.js")).toMatchInlineSnapshot(`
      {
        "css": [
          "assets/index-aa7c8190.css",
        ],
        "imports": [],
        "inputRelPath": "assets/page/assets/index.js",
        "outputRelPath": "assets/pageAssets-05cfe79c.js",
        "preload": [],
        "type": "js",
      }
    `);
    expect(getFileInfos(welcomeLegacyJs, "assets/page/welcome/index-legacy.js")).toMatchInlineSnapshot(`
      {
        "css": [],
        "imports": [],
        "inputRelPath": "assets/page/welcome/index-legacy.js",
        "outputRelPath": "assets/welcome-legacy-64979d13.js",
        "preload": [],
        "type": "js",
      }
    `);
    expect(getFileInfos(legacyPolyfills, "vite/legacy-polyfills")).toMatchInlineSnapshot(`
      {
        "css": [],
        "imports": [],
        "inputRelPath": "vite/legacy-polyfills",
        "outputRelPath": "assets/polyfills-legacy-40963d34.js",
        "preload": [],
        "type": "js",
      }
    `);
  });
});

describe("prepareRollupInputs", () => {
  it("prepare inputs", ({ expect }) => {
    expect(
      prepareRollupInputs({
        ...viteBaseConfig,
        build: {
          rollupOptions: {
            input: {
              app: "./path/to/filename.ts",
              theme: "./other/place/to/theme.scss",
            },
          },
        },
      } as unknown as ResolvedConfig),
    ).toMatchInlineSnapshot(`
      {
        "app": {
          "inputRelPath": "path/to/filename.ts",
          "inputType": "js",
        },
        "theme": {
          "inputRelPath": "other/place/to/theme.scss",
          "inputType": "css",
        },
      }
    `);
  });
});

describe("getInputRelPath", () => {
  it("generate Correct path", ({ expect }) => {
    expect(
      getInputRelPath(
        {
          type: "asset",
          fileName: "theme.css",
        } as OutputAsset,
        { format: "es" } as NormalizedOutputOptions,
        viteBaseConfig,
      ),
    ).toBe("_theme.css");

    expect(
      getInputRelPath(
        {
          type: "chunk",
          facadeModuleId: "/home/me/project-dir/assets/page/welcome/index.js",
          name: "welcome",
        } as OutputChunk,
        { format: "es" } as NormalizedOutputOptions,
        viteBaseConfig,
      ),
    ).toBe("assets/page/welcome/index.js");

    expect(
      getInputRelPath(
        {
          type: "chunk",
          facadeModuleId: "/home/me/project-dir/assets/page/welcome/index.js",
          name: "welcome",
        } as OutputChunk,
        { format: "system" } as NormalizedOutputOptions,
        viteBaseConfig,
      ),
    ).toBe("assets/page/welcome/index-legacy.js");
  });
});
