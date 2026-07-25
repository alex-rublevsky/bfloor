// @ts-check
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";

import icon from "astro-icon";

// import sitemap from "@astrojs/sitemap";

// https://astro.build/config
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
    // {
    //   provider: fontProviders.local(),
    //   name: "Annabelle",
    //   cssVariable: "--font-annabelle",
    //   options: {
    //     variants: [
    //       {
    //         weight: "300",
    //         style: "normal",
    //         src: ["./src/assets/fonts/Annabelle.woff2"],
    //       },
    //     ],
    //   },
    // },
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
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    concurrency: 8,
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },

  image: {
    domains: ["storage.yandexcloud.net"],
  },

  adapter: node({
    mode: "standalone",
  }),

  integrations: [sitemap(), icon()],

  vite: {
    plugins: [tailwindcss()],
  },
});
