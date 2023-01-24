import { join } from "node:path";

export function resolvePluginOptions(userConfig: PluginOptions = {}): Required<PluginOptions> {
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

export function resolveBase(config: Required<PluginOptions>): string {
  return "/" + config.buildDirectory + "/";
}

export function resolveOutDir(config: Required<PluginOptions>): string {
  return join(config.publicDirectory, config.buildDirectory);
}
