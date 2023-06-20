import { join } from "node:path";
import { VitePluginSymfonyOptions } from "./types";

export function resolvePluginOptions(userConfig: Partial<VitePluginSymfonyOptions> = {}): VitePluginSymfonyOptions {
  if (typeof userConfig.publicDirectory === "string") {
    userConfig.publicDirectory = userConfig.publicDirectory.trim().replace(/^\/+/, "").replace(/\/+$/, "");

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
    buildDirectory: userConfig.buildDirectory ?? "build",
    publicDirectory: userConfig.publicDirectory ?? "public",
    refresh: userConfig.refresh ?? false,
    servePublic: userConfig.servePublic,
    debug: userConfig.debug === true ?? false,
    viteDevServerHostname: userConfig.viteDevServerHostname ?? null,
  };
}

export function resolveBase(config: VitePluginSymfonyOptions): string {
  return "/" + config.buildDirectory + "/";
}

export function resolveOutDir(config: VitePluginSymfonyOptions): string {
  return join(config.publicDirectory, config.buildDirectory);
}

export const refreshPaths = ["templates/**/*.twig"];
