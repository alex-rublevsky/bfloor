import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatedGroup } from "~/components/motion_primitives/AnimatedGroup";
import { TextEffect } from "~/components/motion_primitives/AnimatedText";
import { Button } from "~/components/ui/shared/Button";
import NeumorphismCard from "~/components/ui/shared/NeumorphismCard";
import { signIn, signOut, useSession } from "~/utils/auth-client";
import { getAuthStatus } from "~/utils/auth-server-func";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
	loader: async () => {
		try {
			const authStatus = await getAuthStatus();
			return { authStatus };
		} catch (error) {
			console.error("Error loading auth status:", error);
			return { authStatus: { isAuthenticated: false, isAdmin: false } };
		}
	},
});

function RouteComponent() {
	const { data: session } = useSession();
	const { authStatus } = Route.useLoaderData();

	if (session) {
		// Check if user is authorized using server-side check
		const isAuthorized = authStatus?.isAdmin ?? false;

		if (isAuthorized) {
			return (
				<section className="relative min-h-[80dvh] flex items-center justify-center">
					<AnimatedGroup>
						<NeumorphismCard className="text-center max-w-md">
							<TextEffect as="h2" className="mb-4">
								Welcome back!
							</TextEffect>
							<p className="text-muted-foreground mb-6">
								You're already signed in as {session.user.name}
							</p>
							<Button asChild size="lg" className="w-full">
								<Link to="/dashboard">Go to Dashboard</Link>
							</Button>
						</NeumorphismCard>
					</AnimatedGroup>
				</section>
			);
		} else {
			return (
				<section className="relative min-h-[80dvh] flex items-center justify-center">
					<AnimatedGroup>
						<NeumorphismCard className="text-center max-w-md">
							<TextEffect as="h2" className="mb-4">
								Access Restricted
							</TextEffect>
							<p className="text-muted-foreground mb-6">
								You're signed in as {session.user.name} ({session.user.email}),
								but this account doesn't have access to the dashboard.
							</p>
							<Button
								onClick={() => signOut()}
								variant="outline"
								size="lg"
								className="w-full"
							>
								Sign Out
							</Button>
						</NeumorphismCard>
					</AnimatedGroup>
				</section>
			);
		}
	}

	return (
		<section className="relative h-screen flex items-center justify-center">
			<AnimatedGroup>
				<NeumorphismCard className="w-full max-w-md">
					<div className="text-center">
						<TextEffect as="h3" className="mb-2">
							Rublevsky Studio
						</TextEffect>
						<p className="text-muted-foreground mb-8">
							Sign in to access the dashboard
						</p>
					</div>

					<Button
						onClick={() =>
							signIn.social({ provider: "github", callbackURL: "/dashboard" })
						}
						variant="outline"
						size="lg"
						className="w-full flex items-center gap-3"
					>
						<svg
							className="w-5 h-5"
							fill="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								fillRule="evenodd"
								d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
								clipRule="evenodd"
							/>
						</svg>
						Continue with GitHub
					</Button>
				</NeumorphismCard>
			</AnimatedGroup>
		</section>
	);
}
