// @ts-check
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import pagefind from "astro-pagefind";
import { fileURLToPath } from "node:url";

import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
  passthroughImageService,
} from "astro/config";

import icon from "astro-icon";

// import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://bfloor.ru",
  output: "server",
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Overused Grotesk",
      cssVariable: "--font-overused-grotesk",
      options: {
        variants: [
          {
            weight: "300 900",
            style: "normal",
            src: ["./src/assets/fonts/OverusedGrotesk.woff2"],
          },
        ],
      },
    },
  ],
  env: {
    schema: {
      SECRET_BETTER_AUTH: envField.string({
        context: "server",
        access: "secret",
      }),
      PUBLIC_BETTER_AUTH_URL: envField.string({
        context: "server",
        access: "public",
      }),
      SECRET_ADMIN_EMAILS: envField.string({
        context: "server",
        access: "secret",
      }),
      PUBLIC_GOOGLE_CLIENT_ID: envField.string({
        context: "server",
        access: "public",
      }),
      SECRET_GOOGLE_CLIENT: envField.string({
        context: "server",
        access: "secret",
      }),
      PUBLIC_TURSO_DATABASE_URL: envField.string({
        context: "server",
        access: "public",
      }),
      SECRET_TURSO_AUTH_TOKEN: envField.string({
        context: "server",
        access: "secret",
      }),
      S3_URL: envField.string({
        context: "server",
        access: "public",
      }),
      S3_BUCKET_NAME: envField.string({
        context: "server",
        access: "secret",
      }),
      S3_ACCESS_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      S3_SECRET_ACCESS_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      S3_REGION: envField.string({
        context: "server",
        access: "secret",
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
  build: {
    concurrency: 4,
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },

  // TODO: update
  image: {
    // TODO: make it work later with actual image processing
    service: passthroughImageService(),
    domains: ["s3.twcstorage.ru"],
  },

  adapter: node({
    mode: "standalone",
  }),

  integrations: [sitemap(), icon(), pagefind()],

  experimental: {
    incrementalBuild: true,
    svgOptimizer: svgoOptimizer(),
    clientPrerender: true,
  },
});
