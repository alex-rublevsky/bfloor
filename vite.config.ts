import { resolve } from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	server: {
		port: 3000,
		watch: {
			ignored: [
				"**/src/routeTree.gen.ts",
				"**/.tanstack/**",
				"**/node_modules/**",
			],
		},
		proxy: {
			// Always proxy server function calls to production to ensure consistent database usage
			// This ensures both development and production use the same remote database (bfloor-db)
			"/_serverFn": {
				target: "https://bfloor.alexander-rublevskii.workers.dev",
				changeOrigin: true,
				secure: true,
			},
		},
	},
	plugins: [
		tsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		cloudflare({
			viteEnvironment: { name: "ssr" },
			configPath: "./wrangler.jsonc",
		}),
		tanstackStart(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
			generatedRouteTree: "./src/routeTree.gen.ts",
		}),
		viteReact(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	optimizeDeps: {
		exclude: [
			"sqlite",
			//"blake3-wasm"
		],
	},
	// build: {
	//   rollupOptions: {
	//      external: ['sqlite'],
	//     output: {
	//       hoistTransitiveImports: false,
	//     },
	//     treeshake: false,
	//   },
	//   // Disable tree-shaking for problematic packages
	//   commonjsOptions: {
	//     include: [/node_modules/],
	//   },
	//   },

	//TODO: is this needed? can remove?
	// define: {
	//   global: 'globalThis',
	// },
	esbuild: {
		// Preserve function/class names for better stack traces
		keepNames: true,
	},
	// server: {
	//   proxy: {
	//     '/api': {
	//       target: 'http://localhost:8787',
	//       changeOrigin: true,
	//     },
	//   },
	// },

	build: {
		rollupOptions: {
			external: ["tsr:routes-manifest", "sqlite", "blake3-wasm"],
			// treeshake: {
			//   moduleSideEffects: 'no-external',
			// },
		},
	},
});
