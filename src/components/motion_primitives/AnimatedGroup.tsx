import { motion, useInView } from "motion/react";
import React, { type ReactNode, useRef } from "react";

type AnimatedGroupProps = {
	children: ReactNode;
	className?: string;
	amount?: number;
	once?: boolean;
	delay?: number;
	staggerChildren?: number;
};

const defaultTransitionVariants = {
	hidden: {
		opacity: 0,
		filter: "blur(12px)",
		y: 12,
	},
	visible: {
		opacity: 1,
		filter: "blur(0px)",
		y: 0,
		transition: {
			type: "spring",
			bounce: 0.3,
			duration: 1.5,
			filter: { duration: 0.3, ease: "linear" },
		},
	},
};

function AnimatedGroup({
	children,
	className,
	amount = 0.2,
	once = true,
	delay = 0.1,
	staggerChildren = 0.2,
}: AnimatedGroupProps) {
	const ref = useRef(null);
	const isInView = useInView(ref, { amount, once });

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={isInView ? "visible" : "hidden"}
			variants={{
				hidden: {},
				visible: {
					transition: {
						staggerChildren,
						delayChildren: delay,
					},
				},
			}}
			className={className}
		>
			{React.Children.map(children, (child) => (
				<motion.div variants={defaultTransitionVariants}>{child}</motion.div>
			))}
		</motion.div>
	);
}

export { AnimatedGroup };
