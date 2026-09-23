// @ts-check
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";

import icon from "astro-icon";

import alpinejs from "@astrojs/alpinejs";

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
      PUBLIC_YANDEX_STORAGE_BUCKET: envField.string({
        context: "server",
        access: "public",
      }),
      SECRET_YANDEX_STORAGE_ACCESS_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      SECRET_YANDEX_STORAGE_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    concurrency: 4,
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },

  image: {
    domains: ["storage.yandexcloud.net"],
  },

  adapter: node({
    mode: "standalone",
  }),

  integrations: [sitemap(), icon(), alpinejs()],

  experimental: {
    incrementalBuild: true,
    svgOptimizer: svgoOptimizer(),
    clientPrerender: true,
  },
});
