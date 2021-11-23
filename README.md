# Vite plugin Symfony

A Vite plugin to integrate easily Vite in your Symfony application..

- create a `entrypoints.json` inside your build directory with your js/css/preload dependencies.
- reload your browser when you update your twig files
- prebundle your dependencies based on your entry points

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
    server: {
        watch: {
            disableGlobbing: false,
        },
    },
    root: "assets/",
    base: "/build/",
    build: {
        manifest: true,
        emptyOutDir: true,
        assetsDir: "",
        outDir: "../public/build/",
        rollupOptions: {
            input: {
              app: "assets/app.ts"
            },
        },
    }
});
```

```json
// package.json
{
    "scripts": {
        "dev": "vite",
        "build": "vite build"
    },
    "devDependencies": {
        "vite": "^2.1.5"
    }
}
```

## With pentatrion/vite-bundle

Although it has no special dependencies, this package is intended for use with the Symfony Bundle : [pentatrion/vite-bundle](https://github.com/lhapaipai/vite-bundle). This bundle provides two twig functions to load your js/css files into your templates. It also acts as a proxy by forwarding requests that are not intended for it to the Vite dev server.