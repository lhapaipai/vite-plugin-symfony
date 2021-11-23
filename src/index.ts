import type { Plugin } from "vite";

import { resolve } from "path";
import { unlinkSync, existsSync } from "fs";

import { getDevEntryPoints, getBuildEntryPoints } from "./configResolver";
import { writeJson } from "./fileWriter";

let viteConfig = null;
let entryPointsPath: string;

export default function (): Plugin {
  return {
    name: "symfony",
    config(config) {
      if (config.build.rollupOptions.input instanceof Array) {
        console.error("rollupOptions.input must be an Objet like {app: './assets/app.js'}");
        process.exit(1);
      }
      return {
        optimizeDeps: {
          entries: Object.values(config.build.rollupOptions.input),
        },
      };
    },
    configResolved(config) {
      viteConfig = config;
      entryPointsPath = resolve(config.root, config.build.outDir, "entrypoints.json");

      if (config.env.DEV) {
        if (config.build.manifest) {
          const buildDir = resolve(config.root, config.build.outDir, "manifest.json");
          existsSync(buildDir) && unlinkSync(buildDir);
        }

        const entryPoints = getDevEntryPoints(config);
        writeJson(entryPointsPath, entryPoints);
      }

      console.log("config", config);
    },
    configureServer(devServer) {
      const { watcher, ws } = devServer;
      watcher.add(resolve("templates/**/*.twig"));
      watcher.on("change", function (path) {
        if (path.endsWith(".twig")) {
          ws.send({
            type: "full-reload",
          });
        }
      });
    },
    writeBundle(options, bundles) {
      if (!bundles["manifest.json"] || bundles["manifest.json"].type !== "asset") {
        console.error("manifest.json not generated, vite-plugin-symfony need `build.manifest: true`");
        process.exit(1);
      }

      const manifest = JSON.parse(bundles["manifest.json"].source.toString());
      const entryPoints = getBuildEntryPoints(viteConfig, manifest);

      writeJson(entryPointsPath, entryPoints);
    },
  };
}
