import { ActionError } from "astro:actions";
import { isAdmin } from "@/lib/auth";
export function requireAdmin(locals: App.Locals) {
  if (!locals.user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "Необходимо войти в систему",
    });
  }

  if (!isAdmin(locals.user.email)) {
    throw new ActionError({
      code: "FORBIDDEN",
      message: "У вас нет доступа",
    });
  }

  return locals.user;
}
