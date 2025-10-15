import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/shared/Button";

/**
 * Blog Index Error Component
 * Error state for blog index page that matches the skeleton layout
 */
export function BlogIndexErrorComponent({ error }: ErrorComponentProps) {
	return (
		<div className="min-h-screen flex flex-col">
			{/* Header skeleton area */}
			<div className="pt-24 sm:pt-32 pb-8">
				<div className="w-full max-w-6xl mx-auto px-4">
					<div className="text-center space-y-4">
						{/* Error icon */}
						<div className="flex justify-center">
							<AlertTriangle className="h-16 w-16 text-destructive/60" />
						</div>
						
						{/* Error title */}
						<h1 className="text-4xl font-bold text-destructive">
							Oops! Something went wrong
						</h1>
						
						{/* Error message */}
						<p className="text-muted-foreground text-lg max-w-2xl mx-auto">
							We couldn't load the blog posts. This might be due to a network issue or a server problem.
						</p>
					</div>
				</div>
			</div>

			{/* Content area with error details */}
			<div className="flex-1 flex items-start justify-center px-4">
				<div className="w-full max-w-4xl mx-auto">
					<div className="space-y-6">
						{/* Error details */}
						{error && (
							<div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
								<details>
									<summary className="cursor-pointer text-sm font-medium text-destructive hover:text-destructive/80">
										Error details
									</summary>
									<pre className="mt-3 text-xs text-muted-foreground bg-background p-4 rounded border overflow-auto">
										{error.message}
									</pre>
								</details>
							</div>
						)}

						{/* Action buttons */}
						<div className="flex flex-col sm:flex-row gap-3 justify-center">
							<Button
								onClick={() => window.location.reload()}
								className="flex items-center gap-2"
								size="lg"
							>
								<RefreshCw className="h-4 w-4" />
								Try Again
							</Button>
							
							<Button variant="outline" asChild size="lg">
								<Link to="/" className="flex items-center gap-2">
									<Home className="h-4 w-4" />
									Go Home
								</Link>
							</Button>
						</div>

						{/* Help text */}
						<div className="text-center text-sm text-muted-foreground pt-6 border-t">
							<p>
								If this problem persists, please check your internet connection or try again later.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
