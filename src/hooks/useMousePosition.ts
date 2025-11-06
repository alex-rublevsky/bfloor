import { useEffect, useState } from "react";

interface MousePosition {
	mouseX: number;
	mouseY: number;
}

export function useMousePosition(): MousePosition {
	const [mousePosition, setMousePosition] = useState<MousePosition>({
		mouseX: 0,
		mouseY: 0,
	});

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setMousePosition({
				mouseX: e.clientX,
				mouseY: e.clientY,
			});
		};

		window.addEventListener("mousemove", handleMouseMove);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
		};
	}, []);

	return mousePosition;
}
