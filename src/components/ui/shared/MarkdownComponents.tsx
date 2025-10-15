import { Link } from "@tanstack/react-router";
import type { Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

export const markdownComponents: Components = {
	a: ({ href, children, ...props }) => {
		if (href?.startsWith("/")) {
			// Internal link
			return (
				<Link to={href} className="text-primary hover:underline" {...props}>
					{children}
				</Link>
			);
		}
		// External link
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className="text-primary hover:underline"
				{...props}
			>
				{children}
			</a>
		);
	},
	blockquote: ({ children, ...props }) => (
		<blockquote
			className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-muted/30 rounded-r"
			{...props}
		>
			{children}
		</blockquote>
	),
};

// Rehype plugins configuration
export const rehypePlugins = [
	rehypeRaw, // Enable HTML parsing
	rehypeSanitize, // Sanitize HTML for security
];
