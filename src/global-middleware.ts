import { createMiddleware } from "@tanstack/react-start";
import { authMiddleware } from "./utils/auth-middleware";
import { logMiddleware } from "./utils/loggingMiddleware";

// Register middleware globally by importing them
// The middleware will be applied when imported in the app
export const globalMiddleware = createMiddleware().middleware([
	logMiddleware,
	authMiddleware,
]);
