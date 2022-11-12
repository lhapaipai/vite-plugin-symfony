import { Plugin, UserConfig, ResolvedConfig, ViteDevServer } from "vite";
import sirv from "sirv";

import { resolve, join } from "path";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { AddressInfo } from "net";

import { getDevEntryPoints, addBuildEntryPoints } from "./configResolver";
import { addBuildAssets } from "./assetsResolver";
import { writeJson, emptyDir } from "./fileHelper";

import colors from "picocolors";

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

export const refreshPaths = ["templates/**/*.twig"];

function resolveBase(config: Required<PluginOptions>): string {
  return "/" + config.buildDirectory + "/";
}

function resolveOutDir(config: Required<PluginOptions>): string {
  return join(config.publicDirectory, config.buildDirectory);
}

function resolvePluginOptions(userConfig: PluginOptions = {}): Required<PluginOptions> {
  if (typeof userConfig.publicDirectory === "string") {
    userConfig.publicDirectory = userConfig.publicDirectory.trim().replace(/^\/+/, "");

    if (userConfig.publicDirectory === "") {
      throw new Error("vite-plugin-symfony: publicDirectory must be a subdirectory. E.g. 'public'.");
    }
  }

  if (typeof userConfig.buildDirectory === "string") {
    userConfig.buildDirectory = userConfig.buildDirectory.trim().replace(/^\/+/, "").replace(/\/+$/, "");

    if (userConfig.buildDirectory === "") {
      throw new Error("vite-plugin-symfony: buildDirectory must be a subdirectory. E.g. 'build'.");
    }
  }

  if (userConfig.servePublic !== false) {
    userConfig.servePublic = true;
  }

  return {
    servePublic: userConfig.servePublic,
    publicDirectory: userConfig.publicDirectory ?? "public",
    buildDirectory: userConfig.buildDirectory ?? "build",
    refresh: userConfig.refresh ?? false,
    viteDevServerHostname: userConfig.viteDevServerHostname ?? null,
    verbose: userConfig.verbose === true ?? false,
  };
}

function resolveDevServerUrl(
  address: AddressInfo,
  config: ResolvedConfig,
  pluginOptions: Required<PluginOptions>,
): DevServerUrl {
  if (config.server?.origin) {
    return config.server.origin as DevServerUrl;
  }

  const configHmrProtocol = typeof config.server.hmr === "object" ? config.server.hmr.protocol : null;
  const clientProtocol = configHmrProtocol ? (configHmrProtocol === "wss" ? "https" : "http") : null;
  const serverProtocol = config.server.https ? "https" : "http";
  const protocol = clientProtocol ?? serverProtocol;

  const configHmrHost = typeof config.server.hmr === "object" ? config.server.hmr.host : null;
  const configHost = typeof config.server.host === "string" ? config.server.host : null;
  const serverAddress = isIpv6(address) ? `[${address.address}]` : address.address;
  const host = configHmrHost ?? pluginOptions.viteDevServerHostname ?? configHost ?? serverAddress;

  const configHmrClientPort = typeof config.server.hmr === "object" ? config.server.hmr.clientPort : null;
  const port = configHmrClientPort ?? address.port;

  return `${protocol}://${host}:${port}`;
}

function isIpv6(address: AddressInfo): boolean {
  return (
    address.family === "IPv6" ||
    // In node >=18.0 <18.4 this was an integer value. This was changed in a minor version.
    // See: https://github.com/laravel/vite-plugin/issues/103
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    address.family === 6
  );
}

function logConfig(config: any, server: ViteDevServer, depth: number) {
  Object.entries(config).map(([key, value]) => {
    const prefix = " ".repeat(depth);
    const keySpaces = prefix + colors.dim(key) + " ".repeat(30 - key.length - prefix.length);
    if (
      typeof value === "undefined" ||
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "bigint"
    ) {
      server.config.logger.info(`${keySpaces}: ${value ? colors.green(value.toString()) : value}`);
    } else if (typeof value === "string") {
      server.config.logger.info(`${keySpaces}: ${value ? colors.green('"' + value.toString() + '"') : value}`);
    } else if (typeof value === "symbol") {
      server.config.logger.info(`${keySpaces}: symbol`);
    } else if (typeof value === "function") {
      server.config.logger.info(`${keySpaces}: function`);
    } else if (value === null) {
      server.config.logger.info(`${keySpaces}: null`);
    } else if (typeof value === "object") {
      server.config.logger.info(`${key}:`);
      logConfig(value, server, depth + 2);
    } else {
      server.config.logger.info(`${keySpaces}: unknown`);
    }
  });
}

export default function symfony(userOptions: PluginOptions = {}): Plugin {
  const pluginOptions = resolvePluginOptions(userOptions);
  let viteConfig: ResolvedConfig;
  let viteDevServerUrl: string;

  let entryPointsFilename = "entrypoints.json";

  let entryPoints: EntryPoints = {};
  let assets: StringMapping = {};
  let outputCount: number = 0;

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
          outDir: userConfig.build?.outDir ?? resolveOutDir(pluginOptions),
        },
        server: {
          watch: {
            // needed if you want to reload dev server with twig
            disableGlobbing: false,
          },
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
      const { watcher, ws } = devServer;

      devServer.httpServer?.once("listening", () => {
        if (viteConfig.env.DEV) {
          const buildDir = resolve(viteConfig.root, viteConfig.build.outDir);

          if (!existsSync(buildDir)) {
            mkdirSync(buildDir, { recursive: true });
          }

          existsSync(buildDir) && emptyDir(buildDir);

          const address = devServer.httpServer?.address();
          const isAddressInfo = (x: string | AddressInfo | null | undefined): x is AddressInfo => typeof x === "object";

          if (!isAddressInfo(address)) {
            console.error("address is not an object open an issue with your address value to fix the problem", address);
            process.exit(1);
          }

          viteDevServerUrl = resolveDevServerUrl(address, devServer.config, pluginOptions);

          const entryPoints = getDevEntryPoints(viteConfig, viteDevServerUrl);

          let entryPointsPath = resolve(viteConfig.root, viteConfig.build.outDir, entryPointsFilename);
          writeJson(entryPointsPath, {
            isProd: false,
            viteServer: {
              origin: viteDevServerUrl,
              base: viteConfig.base,
            },
            entryPoints,
            assets: null,
            legacy: false
          });
        }

        if (pluginOptions.verbose) {
          setTimeout(() => {
            devServer.config.logger.info(`\n${colors.green("➜")}  Vite Config`);
            logConfig(viteConfig, devServer, 0);
            devServer.config.logger.info(`\n${colors.green("➜")}  End of config \n`);
          }, 100);
        }
      });

      if (pluginOptions.refresh) {
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
            res.end(readFileSync(join(__dirname, "dev-server-404.html")));
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

    generateBundle(options, bundle) {

      addBuildEntryPoints(options, viteConfig, bundle, entryPoints);
      addBuildAssets(viteConfig, bundle, assets);

      outputCount++;
      const output = viteConfig.build.rollupOptions?.output
      const outputLength = Array.isArray(output) ? output.length : 1;

      if (outputCount >= outputLength) {
        this.emitFile({
          fileName: entryPointsFilename,
          type: 'asset',
          source: JSON.stringify({
            isProd: true,
            viteServer: false,
            entryPoints,
            assets,
            legacy: typeof entryPoints['polyfills-legacy'] !== "undefined"
          }, null, 2)
        })
      }
    },
  };
}
