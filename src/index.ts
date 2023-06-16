import { resolve, join, relative, dirname } from "node:path";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import util from "node:util";
import { fileURLToPath } from "node:url";

import { Plugin, UserConfig, ResolvedConfig } from "vite";
import sirv from "sirv";

import colors from "picocolors";

import type { OutputChunk } from "rollup";

import { getDevEntryPoints, addBuildEntryPoints, entryPath2exportPath } from "./entryPointsHelper";
import {
  normalizePath,
  writeJson,
  emptyDir,
  isImportRequest,
  isInternalRequest,
  resolveDevServerUrl,
  isAddressInfo,
} from "./utils";
import { resolvePluginOptions, resolveBase, resolveOutDir, refreshPaths } from "./pluginOptions";

// src and dist directory are in the same level;
const pluginDir = dirname(dirname(fileURLToPath(import.meta.url)));

export default function symfony(userOptions: PluginOptions = {}): Plugin {
  const pluginOptions = resolvePluginOptions(userOptions);
  let viteConfig: ResolvedConfig;
  let viteDevServerUrl: string;

  const entryPointsFilename = "entrypoints.json";

  const entryPoints: EntryPoints = {};
  let outputCount = 0;

  return {
    name: "symfony",
    enforce: "post",
    config(userConfig) {
      if (userConfig.build.rollupOptions.input instanceof Array) {
        console.error("rollupOptions.input must be an Objet like {app: './assets/app.js'}");
        process.exit(1);
      }

      const extraConfig: UserConfig = {
        base: userConfig.base ?? resolveBase(pluginOptions),
        publicDir: false,
        build: {
          manifest: true,
          outDir: userConfig.build?.outDir ?? resolveOutDir(pluginOptions),
        },
        optimizeDeps: {
          //Set to true to force dependency pre-bundling.
          force: true,
        },
      };

      return extraConfig;
    },
    configResolved(config) {
      viteConfig = config;
    },
    configureServer(devServer) {
      // vite server is running

      const { watcher, ws } = devServer;

      // empty the buildDir and create an entrypoints.json file inside.
      devServer.httpServer?.once("listening", () => {
        if (viteConfig.env.DEV) {
          const buildDir = resolve(viteConfig.root, viteConfig.build.outDir);

          if (!existsSync(buildDir)) {
            mkdirSync(buildDir, { recursive: true });
          }

          existsSync(buildDir) && emptyDir(buildDir);

          const address = devServer.httpServer?.address();

          if (!isAddressInfo(address)) {
            console.error("address is not an object open an issue with your address value to fix the problem", address);
            process.exit(1);
          }

          viteDevServerUrl = resolveDevServerUrl(address, devServer.config, pluginOptions);

          const entryPoints = getDevEntryPoints(viteConfig, viteDevServerUrl);

          const entryPointsPath = resolve(viteConfig.root, viteConfig.build.outDir, entryPointsFilename);
          writeJson(entryPointsPath, {
            isProd: false,
            viteServer: {
              origin: viteDevServerUrl,
              base: viteConfig.base,
            },
            entryPoints,
            legacy: false,
          });
        }

        if (pluginOptions.verbose) {
          setTimeout(() => {
            devServer.config.logger.info(`\n${colors.green("➜")}  Vite Config \n`);
            devServer.config.logger.info(util.inspect(viteConfig, { showHidden: false, depth: null, colors: true }));
            devServer.config.logger.info(`\n${colors.green("➜")}  End of config \n`);
          }, 100);
        }
      });

      // full reload vite dev server if twig files are modified.
      if (pluginOptions.refresh !== false) {
        const paths = pluginOptions.refresh === true ? refreshPaths : pluginOptions.refresh;
        for (const path of paths) {
          watcher.add(path);
        }
        watcher.on("change", function (path) {
          if (path.endsWith(".twig")) {
            ws.send({
              type: "full-reload",
            });
          }
        });
      }

      if (pluginOptions.servePublic) {
        // inspired by https://github.com/vitejs/vite
        // file: packages/vite/src/node/server/middlewares/static.ts
        const serve = sirv(pluginOptions.publicDirectory, {
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
          if (req.url === "/" || req.url === "/build/") {
            res.statusCode = 404;
            res.end(readFileSync(join(pluginDir, "static/dev-server-404.html")));
            return;
          }

          // skip import request and internal requests `/@fs/ /@vite-client` etc...
          if (isImportRequest(req.url!) || isInternalRequest(req.url!)) {
            return next();
          }
          serve(req, res, next);
        });
      }
    },
    async renderChunk(code, chunk: OutputChunk & { viteMetadata: ChunkMetadata }, opts) {
      // if entryPoint is not a js file but a css/scss file, only this hook give us the
      // complete path
      if (!chunk.isEntry) {
        return;
      }

      // facadeModuleId give us the complete path of the entryPoint
      // -> /path-to-your-project/assets/welcome.js
      // -> /path-to-your-project/assets/theme.scss
      const fileExt = chunk.facadeModuleId.split(".").pop();
      if (["css", "scss", "sass", "less", "styl", "stylus", "postcss"].indexOf(fileExt) === -1) {
        return;
      }

      // Here we have only css entryPoints
      const cssAssetName = chunk.facadeModuleId
        ? normalizePath(relative(viteConfig.root, chunk.facadeModuleId))
        : chunk.name;

      // chunk.viteMetadata.importedCss contains a Set of relative file paths of css files
      // generated from cssAssetName
      chunk.viteMetadata.importedCss.forEach((cssBuildFilename) => {
        // eg: entryPath2exportPath['assets/theme.scss'] = 'assets/theme-44b5be96.css';
        entryPath2exportPath[cssAssetName] = cssBuildFilename;
      });
    },
    generateBundle(options, bundle) {
      addBuildEntryPoints(options, viteConfig, bundle, entryPoints);

      outputCount++;
      const output = viteConfig.build.rollupOptions?.output;

      // if we have multiple build passes output is an array of each passe.
      // else we have an object of this unique pass
      const outputLength = Array.isArray(output) ? output.length : 1;

      if (outputCount >= outputLength) {
        this.emitFile({
          fileName: entryPointsFilename,
          type: "asset",
          source: JSON.stringify(
            {
              isProd: true,
              viteServer: false,
              entryPoints,
              legacy: typeof entryPoints["polyfills-legacy"] !== "undefined",
            },
            null,
            2,
          ),
        });
      }
    },
  };
}
