import "rollup";

declare module "rollup" {
  export interface RenderedChunk {
    viteMetadata?: ChunkMetadata;
  }
}

interface ChunkMetadata {
  importedAssets: Set<string>;
  importedCss: Set<string>;
}

type EntryPointsFile = {
  isProd: boolean;
  viteServer:
    | {
        origin: string;
        base: string;
      }
    | false;
  entryPoints: EntryPoints;
  assets: StringMapping;
  legacy: boolean;
};

type EntryPoint = {
  assets?: string[];
  js?: string[];
  css?: string[];
  preload?: string[];
  legacy?: boolean | string;
};
type EntryPoints = {
  [k: string]: EntryPoint;
};

type StringMapping = {
  [k: string]: string;
};

type ParsedInputs = {
  [k: string]: ParsedEntry;
};

type ParsedEntry = {
  inputType: "js" | "css";
  inputRelPath: string;
};

type EntryFilesMapping = {
  [k: string]: string;
};

type ManifestEntry = {
  file: string;
  src?: string;
  isEntry?: boolean;
  imports?: string[];
  css?: string[];
};

type Manifest = {
  [k: string]: ManifestEntry;
};

type FileInfos = JsFileInfos | CSSFileInfos | AssetFileInfos;

type JsFileInfos = {
  type: "js";
  outputRelPath: string;
  inputRelPath: string | null;

  imports: string[];

  assets: string[];
  js: string[];
  preload: string[];

  css: string[];
};
type CSSFileInfos = {
  type: "css";
  outputRelPath: string;
  inputRelPath: string | null;

  css: string[];
};
type AssetFileInfos = {
  type: "asset";
  outputRelPath: string;
  inputRelPath: string | null;
};

type GeneratedFiles = {
  [inputRelPath: string]: FileInfos;
};

type DevServerUrl = `${"http" | "https"}://${string}:${number}`;

type VitePluginSymfonyOptions = {
  /**
   * Web directory root
   * Relative file path from project directory root.
   * @default 'public'
   */
  publicDirectory: string;

  /**
   * Build directory (or path)
   * Relative path from web directory root
   * @default 'build'
   */
  buildDirectory: string;

  /**
   * By default vite-plugin-symfony set vite option publicDir to false.
   * Because we don't want symfony entrypoint (index.php) and other files to
   * be copied into the build directory.
   * Related to this issue : https://github.com/lhapaipai/vite-bundle/issues/17
   *
   * Vite plugin Symfony use sirv to serve public directory.
   *
   * If you want to force vite option publicDir to true, set servePublic to false.
   *
   * @default true
   */
  servePublic: boolean;

  /**
   * Refresh vite dev server when your twig templates are updated.
   *  - array of paths to files to be watched, or glob patterns
   *  - true : equivalent to ["templates/**\/*.twig"]
   * @default false
   *
   * for additional glob documentation, check out low-level library picomatch : https://github.com/micromatch/picomatch
   */
  refresh: boolean | string[];

  /**
   * If you specify vite `server.host` option to '0.0.0.0' (usage with Docker)
   * You probably need to configure your `viteDevServerHostname` to 'localhost'.
   * Related to this issue : https://github.com/lhapaipai/vite-bundle/issues/26
   *
   * @default null
   */
  viteDevServerHostname: null | string;

  /**
   * Show vite resolved config
   * @default false
   */
  debug: boolean;
};
