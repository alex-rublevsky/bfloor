import { createMiddleware } from "@tanstack/react-start";

export const logMiddleware = createMiddleware().server(async ({ next }) => {
	const start = Date.now();
	const res = await next();
	const end = Date.now();

	console.log("Server request duration (ms):", end - start);

	return res;
});
