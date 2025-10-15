import styles from "./NeumorphismCard.module.css";

type NeumorphismCardProps = {
	children: React.ReactNode;
	className?: string;
	variant?: "default" | "button";
};

function NeumorphismCard({
	children,
	className,
	variant = "default",
}: NeumorphismCardProps) {
	return (
		<div
			className={`${styles.card} ${variant === "button" ? styles.buttonVariant : ""} ${
				className || ""
			}`}
		>
			{children}
		</div>
	);
}

export default NeumorphismCard;
