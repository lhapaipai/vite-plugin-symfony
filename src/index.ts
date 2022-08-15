import type { Plugin, UserConfig } from "vite";
import sirv from "sirv";

import { resolve } from "path";
import { existsSync, mkdirSync } from "fs";

import { getDevEntryPoints, getBuildEntryPoints } from "./configResolver";
import { getAssets } from "./assetsResolver";
import { writeJson, emptyDir } from "./fileHelper";

/* not imported from vite because we don't want vite in package.json dependancy */
const FS_PREFIX = `/@fs/`;
const VALID_ID_PREFIX = `/@id/`;
const CLIENT_PUBLIC_PATH = `/@vite/client`;
const ENV_PUBLIC_PATH = `/@vite/env`;

const importQueryRE = /(\?|&)import=?(?:&|$)/;
const internalPrefixes = [FS_PREFIX, VALID_ID_PREFIX, CLIENT_PUBLIC_PATH, ENV_PUBLIC_PATH];
const InternalPrefixRE = new RegExp(`^(?:${internalPrefixes.join("|")})`);
const isImportRequest = (url: string): boolean => importQueryRE.test(url);
const isInternalRequest = (url: string): boolean => InternalPrefixRE.test(url);

let viteConfig = null;
let entryPointsPath: string;

export default function (options: PluginOptions = {}): Plugin {
  return {
    name: "symfony",
    config(config) {
      if (config.build.rollupOptions.input instanceof Array) {
        console.error("rollupOptions.input must be an Objet like {app: './assets/app.js'}");
        process.exit(1);
      }

      const extraConfig: UserConfig = {
        server: {
          watch: {
            // needed if you want to reload dev server with twig
            disableGlobbing: false,
          },
          strictPort: true,
        },

        optimizeDeps: {
          //Set to true to force dependency pre-bundling.
          force: true,
        },
      };

      if (!config.server?.origin) {
        const { host = "localhost", port = 5173, https = false } = config.server || {};
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
        writeJson(entryPointsPath, {
          isProd: false,
          viteServer: {
            origin: config.server.origin,
            base: config.base,
          },
          entryPoints,
          assets: null,
        });
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

      if (options.servePublic !== false) {
        const serve = sirv("public", {
          dev: true,
          etag: true,
          extensions: [],
          setHeaders(res, pathname) {
            // Matches js, jsx, ts, tsx.
            // The reason this is done, is that the .ts file extension is reserved
            // for the MIME type video/mp2t. In almost all cases, we can expect
            // these files to be TypeScript files, and for Vite to serve them with
            // this Content-Type.
            if (/\.[tj]sx?$/.test(pathname)) {
              res.setHeader("Content-Type", "application/javascript");
            }

            res.setHeader("Access-Control-Allow-Origin", "*");
          },
        });
        devServer.middlewares.use(function viteServePublicMiddleware(req, res, next) {
          // skip import request and internal requests `/@fs/ /@vite-client` etc...
          if (isImportRequest(req.url!) || isInternalRequest(req.url!)) {
            return next();
          }
          serve(req, res, next);
        });
      }
    },
    writeBundle(options, bundles) {
      if (!bundles["manifest.json"] || bundles["manifest.json"].type !== "asset") {
        console.error("manifest.json not generated, vite-plugin-symfony need `build.manifest: true`");
        process.exit(1);
      }

      const manifest = JSON.parse(bundles["manifest.json"].source.toString());
      const entryPoints = getBuildEntryPoints(viteConfig, manifest);
      const assets = getAssets(viteConfig, bundles);

      writeJson(entryPointsPath, {
        isProd: true,
        viteServer: false,
        entryPoints,
        assets,
      });
    },
  };
}
