/**
 * Content cleaning utilities for handling mixed HTML/text content
 */

/**
 * Cleans up HTML entities and formatting issues in content
 */
export function cleanContent(content: string): string {
	if (!content) return "";
	
	return content
		// Replace HTML line breaks with proper line breaks
		.replace(/\\r\\n/g, '\n')
		.replace(/\\n/g, '\n')
		.replace(/\\r/g, '\n')
		// Replace HTML entities
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		// Clean up excessive whitespace
		.replace(/\n\s*\n\s*\n/g, '\n\n')
		.replace(/[ \t]+/g, ' ')
		.trim();
}

/**
 * Removes HTML structure and converts to clean text with proper paragraph breaks
 */
export function removeHTMLStructure(content: string): string {
	if (!content) return "";
	
	// First clean HTML entities
	let cleaned = cleanContent(content);
	
	// Remove HTML tags but preserve text content
	cleaned = cleaned
		// Remove opening and closing div tags
		.replace(/<div[^>]*>/g, '')
		.replace(/<\/div>/g, '\n\n')
		// Remove other common HTML tags
		.replace(/<p[^>]*>/g, '')
		.replace(/<\/p>/g, '\n\n')
		.replace(/<br\s*\/?>/g, '\n')
		.replace(/<span[^>]*>/g, '')
		.replace(/<\/span>/g, '')
		.replace(/<strong[^>]*>/g, '**')
		.replace(/<\/strong>/g, '**')
		.replace(/<em[^>]*>/g, '*')
		.replace(/<\/em>/g, '*')
		.replace(/<b[^>]*>/g, '**')
		.replace(/<\/b>/g, '**')
		.replace(/<i[^>]*>/g, '*')
		.replace(/<\/i>/g, '*')
		// Remove any remaining HTML tags
		.replace(/<[^>]+>/g, '')
		// Clean up whitespace
		.replace(/\n\s*\n\s*\n/g, '\n\n')
		.replace(/[ \t]+/g, ' ')
		.trim();
	
	return cleaned;
}

/**
 * Detects if content contains HTML tags
 */
export function containsHTML(content: string): boolean {
	if (!content) return false;
	return /<[^>]+>/.test(content);
}

/**
 * Detects if content contains HTML entities
 */
export function containsHTMLEntities(content: string): boolean {
	if (!content) return false;
	return /&[a-zA-Z0-9#]+;/.test(content);
}

/**
 * Formats content for display - removes HTML structure and ensures proper paragraph spacing
 */
export function formatContentForDisplay(content: string): string {
	if (!content) return "";
	
	// Remove HTML structure and convert to clean text
	const cleaned = removeHTMLStructure(content);
	
	// Ensure proper paragraph spacing
	return cleaned
		// Ensure double line breaks between paragraphs
		.replace(/\n\s*\n/g, '\n\n')
		// Add extra spacing for better readability
		.replace(/\n\n/g, '\n\n\n')
		// Clean up excessive spacing
		.replace(/\n\s*\n\s*\n\s*\n/g, '\n\n\n')
		.trim();
}

/**
 * Formats content for editing - removes HTML structure and formats for better editing
 */
export function formatContentForEditing(content: string): string {
	if (!content) return "";
	
	// Remove HTML structure and convert to clean text
	const cleaned = removeHTMLStructure(content);
	
	// Format for better editing experience
	return cleaned
		// Ensure proper paragraph breaks
		.replace(/\n\s*\n/g, '\n\n')
		// Clean up excessive whitespace
		.replace(/[ \t]+/g, ' ')
		.trim();
}

/**
 * Validates content and provides suggestions for improvement
 */
export function validateContent(content: string): {
	isValid: boolean;
	issues: string[];
	suggestions: string[];
} {
	const issues: string[] = [];
	const suggestions: string[] = [];
	
	if (!content) {
		return {
			isValid: false,
			issues: ["Content is empty"],
			suggestions: ["Add some description content"]
		};
	}
	
	// Check for HTML entities
	if (containsHTMLEntities(content)) {
		issues.push("Contains HTML entities");
		suggestions.push("HTML entities will be automatically cleaned");
	}
	
	// Check for HTML structure
	if (containsHTML(content)) {
		issues.push("Contains HTML structure");
		suggestions.push("HTML structure will be removed and converted to clean text");
	}
	
	// Check for excessive whitespace
	if (/\n\s*\n\s*\n\s*\n/.test(content)) {
		issues.push("Excessive line breaks");
		suggestions.push("Excessive line breaks will be normalized");
	}
	
	// Check for very long paragraphs (more than 500 characters without line breaks)
	const paragraphs = content.split(/\n\s*\n/);
	const longParagraphs = paragraphs.filter(p => p.length > 500);
	if (longParagraphs.length > 0) {
		issues.push("Very long paragraphs detected");
		suggestions.push("Consider breaking long paragraphs into shorter ones for better readability");
	}
	
	return {
		isValid: issues.length === 0,
		issues,
		suggestions
	};
}
