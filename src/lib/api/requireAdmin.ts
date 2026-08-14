import { ActionError } from "astro:actions";
import { isAdmin } from "@/lib/auth";
export function requireAdmin(locals: App.Locals) {
  if (!locals.user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in.",
    });
  }

  if (!isAdmin(locals.user.email)) {
    throw new ActionError({
      code: "FORBIDDEN",
      message: "You do not have access.",
    });
  }

  return locals.user;
}
