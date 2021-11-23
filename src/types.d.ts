type EntryPointsFile = {
  isProd: boolean;
  viteServer?: {
    origin: string;
    base: string;
  };
  entryPoints: EntryPoints;
};

type EntryPoint = {
  js: string[];
  css?: string[];
  preload?: string[];
};
type EntryPoints = {
  [k: string]: EntryPoint;
};

type ParsedInput = {
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
