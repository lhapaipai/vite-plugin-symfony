import type { ViteDevServer } from "vite";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "net";
import colors from "picocolors";
import { writeFileSync, rmSync, readdirSync } from "fs";
import { join } from "path";

export const isWindows = os.platform() === "win32";

export function slash(p: string): string {
  return p.replace(/\\/g, "/");
}

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id);
}

export function getLegacyName(name: string) {
  const ext = path.extname(name);
  const endPos = ext.length !== 0 ? -ext.length : undefined;
  name = name.slice(0, endPos) + `-legacy` + ext;
  return name;
}

export function isIpv6(address: AddressInfo): boolean {
  return (
    address.family === "IPv6" ||
    // In node >=18.0 <18.4 this was an integer value. This was changed in a minor version.
    // See: https://github.com/laravel/vite-plugin/issues/103
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    address.family === 6
  );
}

export function logConfig(config: any, server: ViteDevServer, depth: number) {
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

export const writeJson = (filePath: string, jsonData: any) => {
  try {
    writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  } catch (err) {
    throw new Error(`Error writing entrypoints.json ${err.message}`);
  }
};

export const emptyDir = (dir: string) => {
  const files = readdirSync(dir);
  for (const file of files) {
    rmSync(join(dir, file), { recursive: true });
  }
};
