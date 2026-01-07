import type { Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Link } from "./Link";

export const markdownComponents: Components = {
	a: ({ href, children, ...props }) => {
		if (!href) return <span>{children}</span>;
		
		// Use the custom Link component for all links (internal and external)
		return (
			<Link
				href={href}
				className="text-accent"
				target={href.startsWith("/") ? undefined : "_blank"}
				rel={href.startsWith("/") ? undefined : "noopener noreferrer"}
				{...props}
			>
				{children}
			</Link>
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
