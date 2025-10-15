import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "~/components/ui/shared/Button";

export function NotFound({ children }: { children?: ReactNode }) {
	const navigate = useNavigate();
	return (
		<div className="h-full w-full flex flex-col justify-center items-center gap-8">
			<div className="">
				{children || (
					<div className="flex flex-col items-center gap-2">
						<h1>404</h1> <h4>Something is missing...</h4>
					</div>
				)}
			</div>
			<p className="flex items-center gap-3 flex-wrap">
				<Button
					size="lg"
					onClick={() => window.history.back()}
					className="px-2 py-1"
				>
					Go back
				</Button>
				<Button
					variant="outline"
					size="lg"
					onClick={() => navigate({ to: "/" })}
					className="px-2 py-1  "
				>
					Home page
				</Button>
			</p>
		</div>
	);
}
