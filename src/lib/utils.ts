import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Formats a date consistently for display (prevents hydration mismatches)
 * Uses a fixed locale and timezone to ensure server and client render the same
 * @param date - Date object, string, or number (timestamp)
 * @returns Formatted date string (e.g., "12/25/2023")
 */
export function formatDate(date: Date | string | number): string {
	const dateObj =
		typeof date === "string" || typeof date === "number"
			? new Date(date)
			: date;

	// Use a fixed locale and timezone to ensure consistency between server and client
	return dateObj.toLocaleDateString("en-US", {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		timeZone: "UTC",
	});
}
