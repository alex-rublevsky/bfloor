import { useSyncExternalStore } from "react";

// Breakpoints matching Tailwind defaults
const BREAKPOINTS = {
	md: 768,
	lg: 1024,
	xl: 1280,
	"2xl": 1536,
} as const;

// Window size store (singleton)
function createWindowSizeStore() {
	const listeners = new Set<() => void>();
	let snapshot = { width: 0, height: 0 };

	const notify = () => {
		const width = window.innerWidth;
		const height = window.innerHeight;

		// Only update if changed
		if (width !== snapshot.width || height !== snapshot.height) {
			snapshot = { width, height };
			listeners.forEach((listener) => {
				listener();
			});
		}
	};

	const subscribe = (onStoreChange: () => void) => {
		if (typeof window === "undefined") {
			return () => {};
		}

		// Initialize snapshot
		snapshot = { width: window.innerWidth, height: window.innerHeight };

		listeners.add(onStoreChange);
		window.addEventListener("resize", notify, { passive: true });

		return () => {
			listeners.delete(onStoreChange);
			window.removeEventListener("resize", notify);
		};
	};

	const getSnapshot = () => {
		if (typeof window === "undefined") return { width: 0, height: 0 };
		return snapshot;
	};

	const getServerSnapshot = () => ({ width: 0, height: 0 });

	return { subscribe, getSnapshot, getServerSnapshot };
}

const windowSizeStore = createWindowSizeStore();

/**
 * Core device hook - exposes isMobile, isTablet, isDesktop
 */
export function useDevice() {
	const { width } = useSyncExternalStore(
		windowSizeStore.subscribe,
		windowSizeStore.getSnapshot,
		windowSizeStore.getServerSnapshot,
	);

	const isMobile = width < BREAKPOINTS.md;
	const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
	const isDesktop = width >= BREAKPOINTS.lg;

	// Columns: mobile=2, tablet=3, desktop=4-6
	const columnsPerRow = isMobile
		? 2
		: isTablet
			? 3
			: width >= BREAKPOINTS["2xl"]
				? 6
				: width >= BREAKPOINTS.xl
					? 5
					: 4;

	return {
		isMobile,
		isTablet,
		isDesktop,
		isMobileOrTablet: isMobile || isTablet,
		columnsPerRow,
		width,
	};
}

/**
 * Convenience hooks - optimized to only subscribe to width
 */
export function useIsMobile() {
	const { width } = useSyncExternalStore(
		windowSizeStore.subscribe,
		windowSizeStore.getSnapshot,
		windowSizeStore.getServerSnapshot,
	);
	return width < BREAKPOINTS.md;
}

export function useDeviceType() {
	const { width } = useSyncExternalStore(
		windowSizeStore.subscribe,
		windowSizeStore.getSnapshot,
		windowSizeStore.getServerSnapshot,
	);
	return {
		isMobile: width < BREAKPOINTS.md,
		isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
		isDesktop: width >= BREAKPOINTS.lg,
	};
}

export function useResponsiveColumns() {
	const { width } = useSyncExternalStore(
		windowSizeStore.subscribe,
		windowSizeStore.getSnapshot,
		windowSizeStore.getServerSnapshot,
	);
	if (width < BREAKPOINTS.md) return 2;
	if (width < BREAKPOINTS.lg) return 3;
	if (width >= BREAKPOINTS["2xl"]) return 6;
	if (width >= BREAKPOINTS.xl) return 5;
	return 4;
}
