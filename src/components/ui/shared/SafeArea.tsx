import { useId } from "react";
import { useMousePosition } from "~/hooks/useMousePosition";

interface SafeAreaProps {
	anchor: HTMLElement;
	submenu: HTMLElement;
	onMouseEnter: () => void;
}

export function SafeArea({
	anchor: _anchor,
	submenu,
	onMouseEnter,
}: SafeAreaProps) {
	const { mouseY } = useMousePosition();
	const safeAreaId = useId();

	// Get button and submenu positions - position triangle based on these, not mouse
	const anchorRect = _anchor.getBoundingClientRect();
	const submenuRect = submenu.getBoundingClientRect();

	// Calculate triangle to span from button to menu
	// Works for menus both above and below the button
	const svgLeft = anchorRect.right;
	const svgWidth = Math.max(Math.abs(submenuRect.left - anchorRect.right), 10);
	const svgHeight = submenuRect.height;
	const svgTop = submenuRect.top;

	// Triangle starts from mouse Y position relative to SVG, goes to bottom-right and top-right
	const triangleStartY = mouseY - svgTop;

	return (
		<svg
			style={{
				position: "fixed",
				width: svgWidth,
				height: svgHeight,
				pointerEvents: "none",
				zIndex: 49,
				top: svgTop,
				left: svgLeft,
			}}
			id={safeAreaId}
			aria-hidden="true"
		>
			{/* Safe Area - triangular path for hover detection */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: SVG path used for hover detection in safe triangle pattern */}
			<path
				pointerEvents="auto"
				stroke="transparent"
				strokeWidth="0.4"
				fill="transparent"
				d={`M 0, ${Math.max(0, Math.min(triangleStartY, svgHeight))} 
          L ${svgWidth},${svgHeight}
          L ${svgWidth},0 
          z`}
				onMouseEnter={onMouseEnter}
			/>
		</svg>
	);
}
