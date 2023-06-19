import { describe, it } from "vitest";
import { resolvePluginOptions, resolveBase, resolveOutDir } from "../pluginOptions";

describe("resolvePluginOptions", () => {
  it("resolves with default options when no config", ({ expect }) => {
    expect(resolvePluginOptions()).toMatchInlineSnapshot(`
      {
        "buildDirectory": "build",
        "publicDirectory": "public",
        "refresh": false,
        "servePublic": true,
        "verbose": false,
        "viteDevServerHostname": null,
      }
    `);
  });

  it("fix slash prefix for public and build directory", ({ expect }) => {
    expect(
      resolvePluginOptions({
        buildDirectory: "/my-build/depth/",
        publicDirectory: "/www/",
      }),
    ).toMatchInlineSnapshot(`
      {
        "buildDirectory": "my-build/depth",
        "publicDirectory": "www",
        "refresh": false,
        "servePublic": true,
        "verbose": false,
        "viteDevServerHostname": null,
      }
    `);
  });
});

describe("resolveBase", () => {
  it("resolve correctely `base` vite config option", ({ expect }) => {
    expect(
      resolveBase({
        buildDirectory: "build",
      }),
    ).toBe("/build/");

    expect(
      resolveBase({
        buildDirectory: "custom/build",
      }),
    ).toBe("/custom/build/");
  });
});

describe("resolveOutDir", () => {
  it("resolve correctely `build.outDir` vite config option", ({ expect }) => {
    expect(
      resolveOutDir({
        buildDirectory: "build",
        publicDirectory: "public",
      }),
    ).toBe("public/build");

    expect(
      resolveOutDir({
        buildDirectory: "custom/build",
        publicDirectory: "www",
      }),
    ).toBe("www/custom/build");
  });
});
