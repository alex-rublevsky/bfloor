import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, useState } from "react";

interface PostHogWrapperProps {
	children: React.ReactNode;
}

export function PostHogWrapper({ children }: PostHogWrapperProps) {
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		// Initialize PostHog only on client side
		if (typeof window !== "undefined") {
			posthog.init("phc_NZOCp56RiGKfOrTqCPwtI8DK6bOSWK9d4THvTNRWl5s", {
				api_host: "https://us.i.posthog.com",
				person_profiles: "always",
			});
			setIsClient(true);
		}
	}, []);

	// During SSR or before PostHog is ready, render without provider
	if (!isClient) {
		return <>{children}</>;
	}

	// On client side, wrap with PostHog provider
	return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
