interface ColorSquareProps {
	name: string;
	variable: string;
}

const ColorSquare = ({ name, variable }: ColorSquareProps) => {
	return (
		<div className="flex flex-col items-center space-y-1">
			<div
				className="size-16"
				style={{ backgroundColor: variable }}
				title={`${name}: ${variable}`}
			/>
		</div>
	);
};

const ColorPalette = () => {
	const colorVariables = [
		{ name: 'Background', variable: 'var(--background)' },
		{ name: 'Foreground', variable: 'var(--foreground)' },
		{ name: 'Card', variable: 'var(--card)' },
		{ name: 'Card Foreground', variable: 'var(--card-foreground)' },
		{ name: 'Popover', variable: 'var(--popover)' },
		{ name: 'Popover Foreground', variable: 'var(--popover-foreground)' },
		{ name: 'Primary', variable: 'var(--primary)' },
		{ name: 'Primary Foreground', variable: 'var(--primary-foreground)' },
		{ name: 'Secondary', variable: 'var(--secondary)' },
		{ name: 'Secondary Foreground', variable: 'var(--secondary-foreground)' },
		{ name: 'Muted', variable: 'var(--muted)' },
		{ name: 'Muted Foreground', variable: 'var(--muted-foreground)' },
		{ name: 'Accent', variable: 'var(--accent)' },
		{ name: 'Accent Foreground', variable: 'var(--accent-foreground)' },
		{ name: 'Destructive', variable: 'var(--destructive)' },
		{ name: 'Destructive Foreground', variable: 'var(--destructive-foreground)' },
		{ name: 'Border', variable: 'var(--border)' },
		{ name: 'Input', variable: 'var(--input)' },
		{ name: 'Ring', variable: 'var(--ring)' },
		{ name: 'Chart 1', variable: 'var(--chart-1)' },
		{ name: 'Chart 2', variable: 'var(--chart-2)' },
		{ name: 'Chart 3', variable: 'var(--chart-3)' },
		{ name: 'Chart 4', variable: 'var(--chart-4)' },
		{ name: 'Chart 5', variable: 'var(--chart-5)' },
		{ name: 'Sidebar Background', variable: 'var(--sidebar-background)' },
		{ name: 'Sidebar Foreground', variable: 'var(--sidebar-foreground)' },
		{ name: 'Sidebar Primary', variable: 'var(--sidebar-primary)' },
		{ name: 'Sidebar Primary Foreground', variable: 'var(--sidebar-primary-foreground)' },
		{ name: 'Sidebar Accent', variable: 'var(--sidebar-accent)' },
		{ name: 'Sidebar Accent Foreground', variable: 'var(--sidebar-accent-foreground)' },
		{ name: 'Sidebar Border', variable: 'var(--sidebar-border)' },
		{ name: 'Sidebar Ring', variable: 'var(--sidebar-ring)' },
		{ name: 'Discount Badge', variable: 'var(--discount-badge)' },
		{ name: 'Discount Badge Foreground', variable: 'var(--discount-badge-foreground)' },
	];

	return (
		<section className="w-full py-8 px-4">
			<div className="max-w-7xl mx-auto">
				<h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Color Palette</h2>
				<div className="flex flex-wrap justify-center gap-0">
					{colorVariables.map((color) => (
						<ColorSquare
							key={color.name}
							name={color.name}
							variable={color.variable}
						/>
					))}
				</div>
			</div>
		</section>
	);
};

export default ColorPalette;
