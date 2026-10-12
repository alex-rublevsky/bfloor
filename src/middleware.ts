import { defineMiddleware } from "astro:middleware";
import { auth, isAdmin } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isAction = pathname.startsWith("/_actions/");

  const isAdminPage =
    pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/dashboard/login");

  if (isAdminPage || isAction) {
    try {
      const session = await auth.api.getSession({
        headers: context.request.headers,
      });

      if (!session || !session.user) {
        return context.redirect("/dashboard/login");
      }

      if (!isAdmin(session.user.email)) {
        return context.redirect("/dashboard/login?error=unauthorized");
      }
      context.locals.user = session.user;
      context.locals.session = session.session;
    } catch (error) {
      console.error("Auth middleware error:", error);
      return context.redirect("/dashboard/login");
    }
  }

  const response = await next();
  return response;
});
