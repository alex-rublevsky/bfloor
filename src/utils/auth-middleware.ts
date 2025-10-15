import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "~/utils/auth";

type User = {
	id?: string;
	name?: string;
	email?: string;
	image?: string | null;
} | null;

export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const request = getRequest();

	if (!request) {
		return await next({
			context: {
				user: null as User,
			},
		});
	}

	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		return await next({
			context: {
				user: {
					id: session?.user?.id,
					name: session?.user?.name,
					email: session?.user?.email,
					image: session?.user?.image,
				} as User,
			},
		});
	} catch (error) {
		console.error("authMiddleware: getSession failed", error);
		return await next({
			context: {
				user: null as User,
			},
		});
	}
});
