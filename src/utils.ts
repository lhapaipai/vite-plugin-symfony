import type { ResolvedConfig } from "vite";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "net";
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

export const writeJson = (filePath: string, jsonData: any) => {
  try {
    writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  } catch (err) {
    throw new Error(`Error writing ${path.basename(filePath)}: ${err.message}`);
  }
};

export const emptyDir = (dir: string) => {
  const files = readdirSync(dir);
  for (const file of files) {
    rmSync(join(dir, file), { recursive: true });
  }
};

/* not imported from vite because we don't want vite in package.json dependancy */
const FS_PREFIX = `/@fs/`;
const VALID_ID_PREFIX = `/@id/`;
const CLIENT_PUBLIC_PATH = `/@vite/client`;
const ENV_PUBLIC_PATH = `/@vite/env`;

const importQueryRE = /(\?|&)import=?(?:&|$)/;
export const isImportRequest = (url: string): boolean => importQueryRE.test(url);

const internalPrefixes = [FS_PREFIX, VALID_ID_PREFIX, CLIENT_PUBLIC_PATH, ENV_PUBLIC_PATH];
const InternalPrefixRE = new RegExp(`^(?:${internalPrefixes.join("|")})`);
export const isInternalRequest = (url: string): boolean => InternalPrefixRE.test(url);

export function resolveDevServerUrl(
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

export const isAddressInfo = (x: string | AddressInfo | null | undefined): x is AddressInfo => typeof x === "object";
