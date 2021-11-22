const { resolve } = require("path");
const { unlinkSync, existsSync } = require("fs");

const { getDevEntryPoints } = require("./configResolver");
const { writeJson } = require('./fileWriter');

module.exports = () => {
  return {
    name: "symfony",
    configResolved(config) {

      if (config.env.DEV) {
        if (config.build.manifest) {
          let buildDir = resolve(config.root, config.build.outDir, "manifest.json");
          existsSync(buildDir) && unlinkSync(buildDir);
        }

        let entryPoints = getDevEntryPoints(config);
        writeJson(
          resolve(config.root, config.build.outDir, "entrypoints.json"),
          entryPoints
        );
      }

    },
    configureServer(devServer) {
      let { watcher, ws } = devServer;
      watcher.add(resolve("templates/**/*.twig"));
      watcher.on("change", function (path) {
        if (path.endsWith(".twig")) {
          ws.send({
            type: "full-reload",
          });
        }
      });
    },
    writeBundle(options, bundles) {
      if (!bundles['manifest.json']) {
        throw new Error('manifest.json not generated');
      }
      let manifest = JSON.parse(bundles['manifest.json'].source);
      console.log("writeBundle");
    }
  }
};