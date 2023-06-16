import { describe, it } from "vitest";
import { getLegacyName, normalizePath } from "./utils";

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
