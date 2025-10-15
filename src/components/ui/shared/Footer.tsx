import { Button } from "~/components/ui/shared/Button";

export function Footer() {
	return (
		<footer className="flex flex-col items-center justify-center">
				{/* TODO: set the year to a reactive value */}
				<div className="flex gap-2">
				<p className=""> © Все права защищены ООО “BeautyFloor” 2025</p>
				{/* TODO: add link www.rublevsky.studio */}
				<p className="">Сайт создан <span className="">Rublevsky Studio</span></p>
				</div>
			</footer>
	);
}
            