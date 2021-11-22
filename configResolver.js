const process = require('process');
const { resolve } = require("path");



exports.getDevEntryPoints = (config) => {

  if (config.build.rollupOptions.input instanceof Array) {
    throw new Error('rollupOptions.input must be an Objet with EntrypointName -> Entrypointpath')
  }

  let entryPoints = {};

  for (let entryName in config.build.rollupOptions.input) {
    
    let protocol = config.server.https?"https":"http";
    let port = config.server.port??3000;
    let host = config.server.host??"127.0.0.1";

    let origin = `${protocol}://${host}:${port}${config.base}`;
    let entryAbsolutePath = resolve(process.cwd(), config.build.rollupOptions.input[entryName]);

    if (entryAbsolutePath.indexOf(config.root) !== 0) {
      throw new Error('Entry points must be inside Vite root directory')
    }
    let entryRelativePath = entryAbsolutePath.substr(config.root.length+1);
    let entryPoint = {
      js: [`${origin}@vite/client`, `${origin}${entryRelativePath}`],
      css: []
    };
    entryPoints[entryName] = entryPoint;
  }
  return entryPoints;
}