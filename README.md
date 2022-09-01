# Vite plugin Symfony

A Vite plugin to integrate easily Vite in your Symfony application..

- create a `entrypoints.json` file inside your build directory with your js/css/preload dependencies.
- reload your browser when you update your twig files

This package is intended for use with the Symfony Bundle : [pentatrion/vite-bundle](https://github.com/lhapaipai/vite-bundle).

## Installation

```console
npm i vite-plugin-symfony
```

Create this directory structure :
```
├──assets
│ ├──app.js
│ ├──app.css
│...
├──public
├──composer.json
├──package.json
├──vite.config.js
```

Vite base config with vite 3.x

```js
// vite.config.js
import {defineConfig} from "vite";
import symfonyPlugin from "vite-plugin-symfony";

/* if you're using React */
// import reactRefresh from "@vitejs/plugin-react-refresh";

export default defineConfig({
    plugins: [
        /* reactRefresh(), // if you're using React */

        symfonyPlugin({
            /* defaultValues */
            servePublic: true,
            publicDirectory: 'public',
            buildDirectory: 'build',

            /* boolean or array of paths for your twig templates */
            refresh: ["templates/**/*.twig"]
        }),
    ],

    build: {
        rollupOptions: {
            input: {
              app: "./assets/app.js" /* relative to the root option */
            },
        },
    }
});
```

and your package.json :
```json
{
    "scripts": {
        "dev": "vite",
        "build": "vite build"
    },
    "devDependencies": {
        "vite": "^3.0",
        "vite-plugin-symfony": "^0.6.0"
    }
}
```
From the options `publicDirectory` and `buildDirectory`, `vite-plugin-symfony` will automatically determine the right configuration for `vite`:

- `base`
- `build.outDir`

If you have a specific need you can still define your configuration on top.


## With pentatrion/vite-bundle

Although it has no special dependencies, this package is intended for use with the Symfony Bundle : [pentatrion/vite-bundle](https://github.com/lhapaipai/vite-bundle). This bundle provides two twig functions to load your js/css files into your templates. It also acts as a proxy by forwarding requests that are not intended for it to the Vite dev server.

## Migrations

If you use previous version of the plugin consult [migration](migration.md) page.