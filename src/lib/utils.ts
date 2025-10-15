import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Formats a blog post date consistently without timezone issues
 * @param timestamp - The timestamp to format
 * @returns Formatted date string
 */
export function formatBlogDate(timestamp: number): string {
	const date = new Date(timestamp);

	// Extract the date components directly from the UTC timestamp
	// This avoids timezone conversion issues
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}
