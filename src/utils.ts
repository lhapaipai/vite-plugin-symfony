import os from 'node:os'
import path from 'node:path'
import type { OutputChunk } from "rollup";

export const isWindows = os.platform() === 'win32'

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

export function getLegacyName(name: string) {
  const ext = path.extname(name)
  const endPos = ext.length !== 0 ? -ext.length : undefined
  name = name.slice(0, endPos) + `-legacy` + ext
  return name
}
