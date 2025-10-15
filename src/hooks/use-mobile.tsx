import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useDeviceType() {
	const [state, setState] = useState({
		isMobile: false,
		isTablet: false,
		isMobileOrTablet: false,
	});

	useEffect(() => {
		const update = () => {
			const width = window.innerWidth;
			setState({
				isMobile: width < MOBILE_BREAKPOINT,
				isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
				isMobileOrTablet: width < TABLET_BREAKPOINT,
			});
		};

		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, []);

	return state;
}

export const useIsMobile = () => useDeviceType().isMobile;
