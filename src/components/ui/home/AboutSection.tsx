import { Button } from "~/components/ui/shared/Button";
import { ASSETS_BASE_URL } from "~/constants/urls";
import { Image } from "../shared/Image";

function AboutSection() {
	return (
		<div>
			<Image src={`${ASSETS_BASE_URL}/2025/10/about.webp`} alt="О компании" className="rounded-lg" />
			<div>
			<h1>Магазин напольных покрытий</h1>
			<p>
				У нас большой выбор напольных покрытий, для домов, офисов, спортивных
				площадок и других мест отдыха. Мы предоставляем не только
				высококачественную продукцию, но и необходимые инструменты для укладки и
				ухода. Наши специалисты квалифицированно установят напольное покрытие и
				дадут рекомендации.
			</p>
			<p>
				Компания ГРАФИК была основана в 2009 году, и с момента своего основания
				основным видом деятельности является продажа качественных напольных
				покрытий и комплектующих к ним.
			</p>
			<Button variant="outline">Подробнее</Button>
		</div>
		</div>
	);
}

export default AboutSection;
