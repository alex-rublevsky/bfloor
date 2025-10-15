import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useCursorContext } from "./CustomCursorContext";

// Cursor Icon Components (Sized properly for the cursor)
const EnlargeCursor = () => (
	<svg
		width="70"
		height="70"
		viewBox="0 0 29 29"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className="text-primary-foreground"
		aria-hidden="true"
	>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M26 0H18V3H23.6387L14.6982 11.9399L5.76172 3.00281H11.3906V0.00280762L3.39062 0.00267029L2.76074 0.00195312L0.390625 0.00267029V2.36795V3.00281V11.0027H3.39062V5.36404L12.333 14.306L3.39355 23.2449V17.612H0.393555V25.612L0.392578 26.2421V26.246L0.393555 28.612H2.75879H3.39355H11.3936V25.612H5.75879L14.6992 16.6722L23.6357 25.6092H18.0029V28.6092L26.0029 28.6094L26.6367 28.6101L29.0029 28.6094V26.2441V25.6092V17.6094H26.0029V23.2442L17.0645 14.3061L26 5.37106V11H29V3L29.001 2.3699L29 0H26.6348H26Z"
			fill="currentColor"
		/>
	</svg>
);

const LinkCursor = () => (
	<svg
		width="70"
		height="70"
		viewBox="0 0 70 70"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className="text-primary-foreground"
		aria-hidden="true"
	>
		<path
			d="M69.9951 5.71484L70 5.71973L69.9951 5.72461V69.9951H61.9189V13.8008L6.6582 69.0615L0.948242 63.3506L56.2227 8.07617H0V0H69.9951V5.71484Z"
			fill="currentColor"
		/>
	</svg>
);

const AddCursor = () => (
	<svg
		width="70"
		height="70"
		viewBox="0 0 70 70"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className="text-primary-foreground"
		aria-hidden="true"
	>
		<path d="M39 31H70V39H39V70H31V39H0V31H31V0H39V31Z" fill="currentColor" />
	</svg>
);

function Cursor() {
	const { variant, isVisible, setVariant, setIsVisible } = useCursorContext();
	const [isPressed, setIsPressed] = useState(false);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

	// Animation configs matching previous implementation
	const animationConfig = {
		duration: 0.2,
		ease: [0.215, 0.61, 0.355, 1],
	};

	const pressAnimationConfig = {
		duration: 0.1,
		ease: [0.215, 0.61, 0.355, 1],
	};

	// Longer, smoother animation specifically for shrink transition
	const shrinkAnimationConfig = {
		duration: 0.6,
		ease: [0.4, 0, 0.2, 1], // Smooth cubic-bezier curve
	};

	useEffect(() => {
		const updateCursorPosition = (e: MouseEvent | PointerEvent) => {
			// Center the cursor properly (13.5px offset for 27px cursor)
			setMousePosition({
				x: e.clientX - 13.5,
				y: e.clientY - 13.5,
			});
		};

		const handleMouseDown = () => setIsPressed(true);
		const handleMouseUp = () => setIsPressed(false);

		const handleMouseEnter = () => {
			setIsVisible(true);
			setVariant("default");
		};

		const handleMouseLeave = () => {
			setIsVisible(false);
			setVariant("hidden");
		};

		// Check if mouse is already inside the viewport on mount
		const checkInitialMousePosition = (e: MouseEvent) => {
			// If we get a mousemove event, the cursor is in the viewport
			setIsVisible(true);
			setVariant("default");
			updateCursorPosition(e);
			// Remove this listener after first detection
			window.removeEventListener("mousemove", checkInitialMousePosition);
		};

		// Add initial check listener
		window.addEventListener("mousemove", checkInitialMousePosition, {
			once: true,
		});

		// Listen to both mouse and pointer events for better drag support
		window.addEventListener("mousemove", updateCursorPosition);
		window.addEventListener("pointermove", updateCursorPosition);
		window.addEventListener("mousedown", handleMouseDown);
		window.addEventListener("mouseup", handleMouseUp);
		window.addEventListener("pointerdown", handleMouseDown);
		window.addEventListener("pointerup", handleMouseUp);
		document.body.addEventListener("mouseenter", handleMouseEnter);
		document.body.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			window.removeEventListener("mousemove", checkInitialMousePosition);
			window.removeEventListener("mousemove", updateCursorPosition);
			window.removeEventListener("pointermove", updateCursorPosition);
			window.removeEventListener("mousedown", handleMouseDown);
			window.removeEventListener("mouseup", handleMouseUp);
			window.removeEventListener("pointerdown", handleMouseDown);
			window.removeEventListener("pointerup", handleMouseUp);
			document.body.removeEventListener("mouseenter", handleMouseEnter);
			document.body.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [setVariant, setIsVisible]);

	if (!isVisible) return null;

	// Calculate scale factor for press animation (20% smaller = 0.8 scale)
	const pressScale = isPressed ? 0.8 : 1;

	return (
		<>
			{/* Main cursor with blend mode for circle and SVG cursors */}
			<motion.div
				className="fixed pointer-events-none w-7 h-7 flex items-center justify-center"
				style={{
					left: mousePosition.x,
					top: mousePosition.y,
					mixBlendMode: "difference",
					zIndex: 10000000,
				}}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.1 }}
			>
				{/* Circle cursor that smoothly transitions between default, small, and shrink sizes */}
				<motion.div
					className="absolute w-7 h-7 border border-white rounded-full"
					initial={{ scale: 0, opacity: 0 }}
					animate={{
						scale:
							(variant === "default"
								? 2
								: variant === "small"
									? 1.4
									: variant === "shrink"
										? 0
										: 0) * pressScale,
						opacity:
							variant === "default" ||
							variant === "small" ||
							variant === "shrink"
								? 0.12
								: 0,
					}}
					transition={
						isPressed
							? pressAnimationConfig
							: variant === "shrink"
								? shrinkAnimationConfig
								: animationConfig
					}
				/>

				{/* Enlarge SVG cursor */}
				<motion.div
					className="absolute w-12 h-12 flex items-center justify-center"
					initial={{ scale: 0, opacity: 0 }}
					animate={{
						scale: (variant === "enlarge" ? 1 : 0) * pressScale,
						opacity: variant === "enlarge" ? 1 : 0,
					}}
					transition={isPressed ? pressAnimationConfig : animationConfig}
				>
					<EnlargeCursor />
				</motion.div>

				{/* Link SVG cursor */}
				<motion.div
					className="absolute w-12 h-12 flex items-center justify-center"
					initial={{ scale: 0, opacity: 0 }}
					animate={{
						scale: (variant === "link" ? 1 : 0) * pressScale,
						opacity: variant === "link" ? 1 : 0,
					}}
					transition={isPressed ? pressAnimationConfig : animationConfig}
				>
					<LinkCursor />
				</motion.div>

				{/* Add SVG cursor */}
				<motion.div
					className="absolute w-12 h-12 flex items-center justify-center"
					initial={{ scale: 0, opacity: 0 }}
					animate={{
						scale: (variant === "add" ? 1 : 0) * pressScale,
						opacity: variant === "add" ? 1 : 0,
					}}
					transition={isPressed ? pressAnimationConfig : animationConfig}
				>
					<AddCursor />
				</motion.div>
			</motion.div>

			{/* Visit website cursor - separate from blend mode context */}
			<motion.div
				className="fixed pointer-events-none w-7 h-7 flex items-center justify-center"
				style={{
					left: mousePosition.x,
					top: mousePosition.y,
					zIndex: 10000000,
				}}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.1 }}
			>
				<motion.div
					className="absolute flex items-center justify-center bg-primary text-primary-foreground rounded-3xl text-sm font-medium whitespace-nowrap px-7 py-4"
					initial={{ scale: 0, opacity: 0 }}
					animate={{
						scale: (variant === "visitWebsite" ? 1 : 0) * pressScale,
						opacity: variant === "visitWebsite" ? 1 : 0,
					}}
					transition={isPressed ? pressAnimationConfig : animationConfig}
				>
					<p>Visit the website</p>
				</motion.div>
			</motion.div>
		</>
	);
}

export default Cursor;
