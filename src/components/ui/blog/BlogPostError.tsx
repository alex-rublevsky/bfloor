import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/shared/Button";

/**
 * Blog Post Error Component
 * Error state for individual blog post pages that matches the skeleton layout
 */
export function BlogPostErrorComponent({ error }: ErrorComponentProps) {
	return (
		<main className="min-h-screen flex flex-col lg:h-screen lg:overflow-hidden">
			<div className="grow flex items-start justify-center">
				<div className="w-full h-full flex flex-col lg:flex-row gap-0 lg:gap-10 items-start">
					{/* Error image placeholder - matches skeleton layout */}
					<div className="w-full lg:flex-1 flex flex-col lg:flex-row gap-2 lg:h-full self-start">
						<div className="w-full h-[50vh] lg:h-full bg-destructive/10 border-2 border-destructive/20 flex items-center justify-center">
							<AlertTriangle className="h-16 w-16 text-destructive/60" />
						</div>
					</div>

					{/* Error content - matches skeleton layout */}
					<div className="w-full md:max-w-[45ch] lg:max-w-[55ch] xl:max-w-[65ch] px-4 lg:h-[100dvh] lg:overflow-y-auto pb-20 lg:pr-4 scrollbar-none lg:flex-shrink-0">
						<div className="space-y-6 w-full pt-4">
							{/* Error title */}
							<div className="space-y-4">
								<h1 className="text-3xl font-bold text-destructive">
									Oops! Something went wrong
								</h1>
								<p className="text-muted-foreground text-lg">
									We couldn't load this blog post. This might be due to a network issue or the post might not exist.
								</p>
							</div>

							{/* Error details */}
							{error && (
								<details className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
									<summary className="cursor-pointer text-sm font-medium text-destructive hover:text-destructive/80">
										Error details
									</summary>
									<pre className="mt-3 text-xs text-muted-foreground bg-background p-3 rounded border overflow-auto">
										{error.message}
									</pre>
								</details>
							)}

							{/* Action buttons */}
							<div className="flex flex-col sm:flex-row gap-3 pt-4">
								<Button
									onClick={() => window.location.reload()}
									className="flex items-center gap-2"
								>
									<RefreshCw className="h-4 w-4" />
									Try Again
								</Button>
								
								<Button variant="outline" asChild>
									<Link to="/blog" className="flex items-center gap-2">
										<Home className="h-4 w-4" />
										All Posts
									</Link>
								</Button>
								
								<Button 
									variant="ghost" 
									onClick={() => window.history.back()}
									className="flex items-center gap-2"
								>
									<ArrowLeft className="h-4 w-4" />
									Go Back
								</Button>
							</div>

							{/* Help text */}
							<div className="text-sm text-muted-foreground pt-4 border-t">
								<p>
									If this problem persists, please check your internet connection or try again later.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
