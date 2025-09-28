// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import node from "@astrojs/node";


// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],

  vite: {
    plugins: [
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./src/paraglide",
        disableAsyncLocalStorage: true,
      }),
      tailwindcss(),
      
    ],
  },
  output: "server",
  adapter: node({ mode: "standalone" }),
});