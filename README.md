# Vite plugin Symfony

A Vite plugin to integrate easily Vite in your Symfony application..

- create a `entrypoints.json` inside your build directory with your js/css/preload dependencies.
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
            servePublic: true /* defaultValue */
        }),
    ],

    root: ".",

    /* your outDir web path prefix */
    base: "/build/",

    /* By default, Vite will copy all assets in /public to the build directory. */
    /* no longer needed because your web server already does it */
    publicDir: false,

    build: {
        manifest: true,
        emptyOutDir: true,
        assetsDir: "",
        outDir: "./public/build",
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
        "vite-plugin-symfony": "^0.4.0"
    }
}
```

## Migration

For vite v2.8/v2.9 use vite-plugin-symfony v0.3.x

## Vitejs previous versions

Vite base config with vite 2.8/2.9

```js
// vite.config.js
import {defineConfig} from "vite";
import symfonyPlugin from "vite-plugin-symfony";
/* if you're using React */
// import reactRefresh from "@vitejs/plugin-react-refresh";

export default defineConfig({
    plugins: [
        /* reactRefresh(), // if you're using React */
        symfonyPlugin(),
    ],

    root: ".",

    /* your outDir web path prefix */
    base: "/build/",

    /* By default, Vite will copy all assets in /public to the build directory. */
    /* no longer needed because your web server already does it */
    publicDir: false,

    build: {
        manifest: true,
        emptyOutDir: true,
        assetsDir: "",
        outDir: "./public/build",
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
        "vite": "~2.9",
        "vite-plugin-symfony": "^0.3.0"
    }
}
```



There is small differences in the configuration of the input paths with vitejs 2.6 and vitejs 2.7.

```js
// vite 2.7
// vite.config.js
import {defineConfig} from "vite";
import symfonyPlugin from "vite-plugin-symfony";
/* if you're using React */
// import reactRefresh from "@vitejs/plugin-react-refresh";

export default defineConfig({
    plugins: [
        /* reactRefresh(), // if you're using React */
        symfonyPlugin(),
    ],

    root: "./assets/",

    /* your outDir web path prefix */
    base: "/build/",
    build: {
        manifest: true,
        emptyOutDir: true,
        assetsDir: "",
        outDir: "../public/build/",
        rollupOptions: {
            input: {
              app: "./app.ts" /* relative to the root option */
            },
        },
    }
});
```



```js
// Vite 2.6
// vite.config.js
import {defineConfig} from "vite";
import symfonyPlugin from "vite-plugin-symfony";
/* if you're using React */
// import reactRefresh from "@vitejs/plugin-react-refresh";

export default defineConfig({
    plugins: [
        /* reactRefresh(), // if you're using React */
        symfonyPlugin(),
    ],

    root: "./assets/",

    /* your outDir web path prefix */
    base: "/build/",
    build: {
        manifest: true,
        emptyOutDir: true,
        assetsDir: "",
        outDir: "../public/build/",
        rollupOptions: {
            input: {
              app: "./assets/app.ts" /* relative to the root option */
            },
        },
    }
});
```

## With pentatrion/vite-bundle

Although it has no special dependencies, this package is intended for use with the Symfony Bundle : [pentatrion/vite-bundle](https://github.com/lhapaipai/vite-bundle). This bundle provides two twig functions to load your js/css files into your templates. It also acts as a proxy by forwarding requests that are not intended for it to the Vite dev server.