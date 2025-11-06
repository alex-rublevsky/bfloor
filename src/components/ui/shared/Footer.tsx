export function Footer() {
	return (
		<footer className="flex flex-col items-center justify-center py-16">
			{/* TODO: set the year to a reactive value */}
			<div className="flex gap-2">
				<p className=""> © Все права защищены ООО "BeautyFloor" 2025</p>
				{/* TODO: add link www.rublevsky.studio */}
				<p className="">
					Понравился сайт?{" "}
					<a
						href="https://www.rublevsky.studio"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:text-primary-hover transition-colors"
					>
						Написать разработчику{" "}
					</a>
				</p>
			</div>
		</footer>
	);
}
