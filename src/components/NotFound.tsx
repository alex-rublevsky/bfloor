import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "~/components/ui/shared/Button";

export function NotFound({ children }: { children?: ReactNode }) {
	const navigate = useNavigate();
	return (
		<div className="flex-1 flex flex-col">
			<main className="flex-1 flex justify-center items-center">
				<div className="text-center">
					<div className="">
						{children || (
							<div className="flex flex-col items-center gap-2">
								<h1>404</h1> <h4>Страница не найдена...</h4>
							</div>
						)}
					</div>
					<p className="flex items-center gap-3 flex-wrap justify-center mt-8">
						<Button
							size="lg"
							onClick={() => window.history.back()}
							className="px-2 py-1"
						>
							Назад
						</Button>
						<Button
							variant="outline"
							size="lg"
							onClick={() => navigate({ to: "/" })}
							className="px-2 py-1"
						>
							Главная страница
						</Button>
					</p>
				</div>
			</main>
		</div>
	);
}
