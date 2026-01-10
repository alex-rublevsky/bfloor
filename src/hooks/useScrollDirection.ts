import { useEffect, useRef, useState } from "react";

/**
 * Detects scroll direction to show/hide navbar
 *
 * @param threshold - Scroll distance before hiding navbar (default: 100px)
 * @returns shouldShowNavbar - Whether navbar should be visible
 */
export function useScrollDirection(threshold = 100) {
	const [shouldShowNavbar, setShouldShowNavbar] = useState(true);
	const lastScrollY = useRef(0);
	const ticking = useRef(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		lastScrollY.current = window.scrollY;

		const updateScrollDirection = () => {
			const currentScrollY = window.scrollY;
			const scrollDiff = currentScrollY - lastScrollY.current;

			// At top: always show
			if (currentScrollY < 10) {
				setShouldShowNavbar(true);
				lastScrollY.current = currentScrollY;
				ticking.current = false;
				return;
			}

			// Ignore tiny scroll changes (< 3px)
			if (Math.abs(scrollDiff) < 3) {
				lastScrollY.current = currentScrollY;
				ticking.current = false;
				return;
			}

			// Scrolling down: hide if past threshold
			if (scrollDiff > 0 && currentScrollY > threshold) {
				setShouldShowNavbar(false);
			}
			// Scrolling up: always show
			else if (scrollDiff < 0) {
				setShouldShowNavbar(true);
			}

			lastScrollY.current = currentScrollY;
			ticking.current = false;
		};

		const onScroll = () => {
			if (!ticking.current) {
				window.requestAnimationFrame(updateScrollDirection);
				ticking.current = true;
			}
		};

		updateScrollDirection();
		window.addEventListener("scroll", onScroll, { passive: true });

		return () => window.removeEventListener("scroll", onScroll);
	}, [threshold]);

	return { shouldShowNavbar };
}
