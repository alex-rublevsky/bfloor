import { createMiddleware } from "@tanstack/react-start";

const preLogMiddleware = createMiddleware()
	.client(async (ctx) => {
		const clientTime = new Date();

		return ctx.next({
			context: {
				clientTime,
			},
			sendContext: {
				clientTime,
			},
		});
	})
	.server(async (ctx) => {
		const serverTime = new Date();

		return ctx.next({
			sendContext: {
				serverTime,
				durationToServer:
					serverTime.getTime() - ctx.context.clientTime.getTime(),
			},
		});
	});

export const logMiddleware = createMiddleware()
	.middleware([preLogMiddleware])
	.client(async (ctx) => {
		const res = await ctx.next();

	// Removed client request/response logging

		return res;
	});
