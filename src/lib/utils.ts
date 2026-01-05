import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Formats a date consistently for display (prevents hydration mismatches)
 * Uses a fixed locale and timezone to ensure server and client render the same
 * Automatically detects Unix timestamps in seconds and converts to milliseconds
 * @param date - Date object, string, or number (timestamp in seconds or milliseconds)
 * @returns Formatted date string (e.g., "12/25/2023")
 */
export function formatDate(date: Date | string | number): string {
	let dateObj: Date;

	if (typeof date === "number") {
		// Auto-detect Unix timestamp in seconds (numbers < 1e12 are likely seconds)
		// 1e12 = 1,000,000,000,000 ms = ~2001-09-09 in milliseconds
		const timestamp = date < 1e12 ? date * 1000 : date;
		dateObj = new Date(timestamp);
	} else if (typeof date === "string") {
		dateObj = new Date(date);
	} else {
		dateObj = date;
	}

	// Use a fixed locale and timezone to ensure consistency between server and client
	return dateObj.toLocaleDateString("en-US", {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		timeZone: "UTC",
	});
}
