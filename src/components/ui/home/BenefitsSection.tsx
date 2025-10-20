import BenefitEntry from "./testimonial/BenefitEntry";

const benefits = [
	{
		title: "Доставка по всей России",
		description: "Доставим бесплатно до транспортной компании",
		icon: "🚚",
	},
	{
		title: "Профессиональная бригада укладчиков",
		description: "Установит любой тип покрытий с гарантией",
		icon: "👷‍♂️",
	},
	{
		title: "Бесплатное бессрочное хранение",
		description: "На нашем складе",
		icon: "📦",
	},
	{
		title: "Проверенное качество",
		description: "Продаем только качественные материалы",
		icon: "✅",
	},
	{
		title: "Даём гарантии",
		description:
			"Если качество не будет соответствовать заявленным характеристикам",
		icon: "🛡️",
	},
];

function BenefitsSection() {
	return (
		<div>
			{benefits.map((benefit) => (
				<div key={benefit.title}>
					<BenefitEntry
						title={benefit.title}
						description={benefit.description}
						icon={benefit.icon}
					/>
				</div>
			))}
		</div>
	);
}

export default BenefitsSection;
