import { describe, it } from "vitest";
import { prepareRollupInputs } from "./entryPointsHelper";

describe("prepareRollupInputs", () => {
  it("prepare inputs", ({ expect }) => {
    expect(
      prepareRollupInputs({
        root: "/home/me/project-dir",
        build: {
          rollupOptions: {
            input: {
              app: "./path/to/filename.ts",
              theme: "./other/place/to/theme.scss",
            },
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "app": {
          "entryPath": "path/to/filename.ts",
          "entryType": "js",
        },
        "theme": {
          "entryPath": "other/place/to/theme.scss",
          "entryType": "css",
        },
      }
    `);
  });
});

// describe("getDevEntryPoints", () => {
//   it("generate correct entrypoints", ({expect}) => {
//     expect(getDevEntryPoints)
//   })
// })
