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
        symfonyPlugin(/* options */),
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
        "vite": "^4.0",
        "vite-plugin-symfony": "^0.7.3"
    }
}
```

### Options

```ts
{
    /**
     * Web directory root
     * Relative file path from project directory root.
     * @default 'public'
     */
    publicDirectory: string

    /**
     * Build directory (or path)
     * Relative path from web directory root
     * @default 'build'
     */
    buildDirectory: string

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
    servePublic: boolean

    /**
     * Refresh vite dev server when your twig templates are updated.
     *  - array of paths to files to be watched, or glob patterns
     *  - true : equivalent to ["templates/**\/*.twig"]
     * @default false
     * 
     * for additional glob documentation, check out low-level library picomatch : https://github.com/micromatch/picomatch
     */
    refresh: boolean | string[]

    /**
     * If you specify vite `server.host` option to '0.0.0.0' (usage with Docker)
     * You probably need to configure your `viteDevServerHostname` to 'localhost'.
     * Related to this issue : https://github.com/lhapaipai/vite-bundle/issues/26
     * 
     * @default null
     */
    viteDevServerHostname: null | string
}
```

### Note

`vite-plugin-symfony` use this options :
- `publicDirectory`
- `buildDirectory`

to determine the right configuration for `vite`:
- `base`
- `build.outDir`

so **you have to specify the configuration either from the plugin or from vite but not in both**

```js
// vite.config.js
import symfonyPlugin from "vite-plugin-symfony";

export default {
    plugins: [
        symfonyPlugin({
          publicDirectory: 'public',
          buildDirectory:  'build'
        }),
    ],
};
```

or

```js
// vite.config.js

// If you have a specific need you can still define your configuration on top.
import symfonyPlugin from "vite-plugin-symfony";

export default {
    plugins: [
        symfonyPlugin(),
    ],
    base: '/build/',
    build: {
      outDir: './public/build'
    }
};
```

## With pentatrion/vite-bundle

Although it has no special dependencies, this package is intended for use with the Symfony Bundle : [pentatrion/vite-bundle](https://github.com/lhapaipai/vite-bundle). This bundle provides two twig functions to load your js/css files into your templates. It also acts as a proxy by forwarding requests that are not intended for it to the Vite dev server.

## Migrations

If you use previous version of the plugin consult [migration](migration.md) page.

## In depth

default js entryPoint

```json
{
  "isProd": true,
  "viteServer": false,
  "entryPoints": {
    "welcome": {
      "js": [
        "/build/assets/welcome-1e67239d.js"
      ],
      "css": [],
      "preload": [],
      "legacy": false
    }
  }
}
```

css entry point
```json
{
  "isProd": true,
  "viteServer": false,
  "entryPoints": {
    "theme": {
      "js": [],
      "css": [
        "/build/assets/theme-44b5be96.css"
      ],
      "preload": [],
      "legacy": false
    }
  }
}
```
