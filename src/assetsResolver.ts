import type { OutputBundle } from "rollup";
import type { ResolvedConfig } from "vite";

export const getAssets = (config: ResolvedConfig, bundles: OutputBundle) => {
  const assets = {};
  Object.values(bundles)
    .filter(({ type, name }) => {
      return type === "asset" && name;
    })
    .forEach(({ name, fileName }) => {
      assets[name] = config.base + fileName;
    });
  return assets;
};
