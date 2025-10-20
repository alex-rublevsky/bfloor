export default function BenefitEntry({
	title,
	description,
	icon,
}: {
	title: string;
	description: string;
	icon: string;
}) {
	return (
		<div className="flex items-center text-center gap-4 w-full py-6">
			<div className="w-16 h-16 flex items-center justify-center">
				{icon}
			</div>
			<div className="flex flex-col gap-2">
				<h5 className="font-medium">{title}</h5>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
		</div>
	);
}
