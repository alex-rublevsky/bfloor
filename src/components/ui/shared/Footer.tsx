import { Button } from "~/components/ui/shared/Button";

export function Footer() {
	return (
		<footer className="flex flex-col items-center justify-center">
				<p className="text-center">Let's level up your business together!</p>
				<div className="flex flex-wrap gap-2 justify-center pb-4 pt-2 border-t border-gray-200/20">
					<Button
						href="https://assets.rublevsky.studio/PDF/Resume%20Alexander%20Rublevsky.pdf"
						target="_blank"
						variant="secondary"
					>
						Resume
					</Button>
					<Button
						href="https://t.me/alexrublevsky"
						target="_blank"
						variant="secondary"
					>
						Telegram
					</Button>
					<Button href="mailto:alexander@rublevsky.studio" variant="secondary">
						Email
					    </Button>
				</div>
			</footer>
		
	);
}
            