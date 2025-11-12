import { resolve } from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
	return {
		server: {
			port: 3000,
			watch: {
				ignored: [
					"**/src/routeTree.gen.ts",
					"**/.tanstack/**",
					"**/node_modules/**",
				],
			},
		},
		plugins: [
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
			// Use Cloudflare plugin to connect to production D1 database
			cloudflare({
				viteEnvironment: { name: "ssr" },
				configPath: "./wrangler.jsonc",
				// Configure for development mode
				//persist: false, // Don't persist data locally
			}),
			tanstackStart({
				// Configure client base URL to use production for server functions
				client: {
					base: "https://bfloor.romavg.workers.dev",
				},
				// Note: Static server functions (staticFunctionMiddleware) work automatically
				// during production builds. The middleware caches results to static JSON files
				// in the build output directory (TSS_CLIENT_OUTPUT_DIR is set automatically).
			}),
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
		esbuild: {
			// Preserve function/class names for better stack traces
			keepNames: true,
		},
		define: {
			// Force server functions to use production URL
			"process.env.TANSTACK_START_SERVER_FN_BASE_URL": JSON.stringify(
				"https://bfloor.romavg.workers.dev",
			),
			"import.meta.env.VITE_SERVER_FN_BASE_URL": JSON.stringify(
				"https://bfloor.romavg.workers.dev",
			),
		},
		build: {
			rollupOptions: {
				external: ["tsr:routes-manifest", "sqlite", "blake3-wasm"],
			},
		},
	};
});
