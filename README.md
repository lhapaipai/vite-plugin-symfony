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

Vite base config

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

and your package.json :
```json
{
    "scripts": {
        "dev": "vite",
        "build": "vite build"
    },
    "devDependencies": {
        "vite": "~2.7",
        "vite-plugin-symfony": "^0.2.0"
    }
}
```

## Migration from v0.1.x to v0.2.x

There is a small difference in the configuration of the input paths between these 2 versions.

```diff
// vite.config.js

export default defineConfig({

    root: "./assets/",

    build: {
        rollupOptions: {
            input: {
-              /* vite-plugin-symfony v0.1.x */
-              app: "./assets/app.ts" /* relative to the Symfony project root */
+              /* vite-plugin-symfony v0.2.x */
+              app: "./app.ts"        /* relative to the vite.config.js root option */
            },
        },
    }
});
```
this issue comes from the fact that :
- vite-plugin-symfony v0.1.x requires vite v2.6.x
- vite-plugin-symfony v0.2.x requires vite v2.7.x


## With pentatrion/vite-bundle

Although it has no special dependencies, this package is intended for use with the Symfony Bundle : [pentatrion/vite-bundle](https://github.com/lhapaipai/vite-bundle). This bundle provides two twig functions to load your js/css files into your templates. It also acts as a proxy by forwarding requests that are not intended for it to the Vite dev server.