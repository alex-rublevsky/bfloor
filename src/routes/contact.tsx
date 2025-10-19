import { createFileRoute } from "@tanstack/react-router";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/contact")({
	component: ContactPage,
	head: () => ({
		meta: [
			...seo({
				title: "Контакты - BeautyFloor",
				description:
					"Свяжитесь с нами для получения информации о напольных покрытиях",
			}),
		],
	}),
});

function ContactPage() {
	return (
		<div className="min-h-screen bg-background pt-20 pb-20">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-2xl mx-auto">
					<h1 className="text-3xl font-bold mb-8 text-center">Контакты</h1>

					<div className="space-y-6">
						<div className="bg-card p-6 rounded-lg border">
							<h2 className="text-xl font-semibold mb-4">Свяжитесь с нами</h2>
							<div className="space-y-3">
								<div>
									<h3 className="font-medium">Телефон:</h3>
									<p className="text-muted-foreground">+7 (XXX) XXX-XX-XX</p>
								</div>
								<div>
									<h3 className="font-medium">Email:</h3>
									<p className="text-muted-foreground">info@beautyfloor.ru</p>
								</div>
								<div>
									<h3 className="font-medium">Адрес:</h3>
									<p className="text-muted-foreground">
										Владивосток, ул. Примерная, д. 123
									</p>
								</div>
							</div>
						</div>

						<div className="bg-card p-6 rounded-lg border">
							<h2 className="text-xl font-semibold mb-4">Часы работы</h2>
							<div className="space-y-2">
								<p className="text-muted-foreground">Пн-Пт: 9:00 - 18:00</p>
								<p className="text-muted-foreground">Сб: 10:00 - 16:00</p>
								<p className="text-muted-foreground">Вс: Выходной</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
