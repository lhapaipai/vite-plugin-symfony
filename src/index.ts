import type { Plugin, UserConfig } from "vite";

import { resolve } from "path";
import { existsSync, mkdirSync } from "fs";

import { getDevEntryPoints, getBuildEntryPoints } from "./configResolver";
import { writeJson, emptyDir } from "./fileHelper";

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

      const extraConfig: UserConfig = {
        server: {
          //Set to true to force dependency pre-bundling.
          force: true,
          watch: {
            // needed if you want to reload dev server with twig
            disableGlobbing: false,
          },

          /* you need to authorize Vite to have a build 
           directory outside your root directory */

          fs: {
            allow: [".."],
          },
        },
      };

      if (!config.server.origin) {
        const { host = "localhost", port = 3000, https = false } = config.server;
        extraConfig.server.origin = `http${https ? "s" : ""}://${host}:${port}`;
      }

      return extraConfig;
    },
    configResolved(config) {
      viteConfig = config;
      entryPointsPath = resolve(config.root, config.build.outDir, "entrypoints.json");

      if (config.env.DEV) {
        const buildDir = resolve(config.root, config.build.outDir);

        if (!existsSync(buildDir)) {
          mkdirSync(buildDir, { recursive: true });
        }

        existsSync(buildDir) && emptyDir(buildDir);

        const entryPoints = getDevEntryPoints(config);
        writeJson(entryPointsPath, entryPoints);
      }
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
