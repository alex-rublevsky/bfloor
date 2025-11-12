/**
 * Custom hook for hover dropdown functionality
 * Handles mouse enter/leave with delay to prevent accidental closes
 */

import { useEffect, useRef, useState } from "react";

interface UseHoverDropdownOptions {
	/** Delay in milliseconds before closing dropdown on mouse leave */
	closeDelay?: number;
}

interface UseHoverDropdownReturn {
	/** Whether dropdown is currently open */
	isOpen: boolean;
	/** Ref to attach to parent/trigger element */
	parentRef: React.RefObject<HTMLDivElement | null>;
	/** Ref to attach to dropdown menu element */
	childRef: React.RefObject<HTMLDivElement | null>;
	/** Handler for mouse enter */
	handleMouseEnter: () => void;
	/** Handler for mouse leave */
	handleMouseLeave: () => void;
}

/**
 * Hook for managing hover dropdown state with safe area support
 * Provides consistent hover behavior across all dropdown components
 */
export function useHoverDropdown(
	options: UseHoverDropdownOptions = {},
): UseHoverDropdownReturn {
	const { closeDelay = 200 } = options;
	const [isOpen, setIsOpen] = useState(false);
	const parentRef = useRef<HTMLDivElement>(null);
	const childRef = useRef<HTMLDivElement>(null);
	const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const handleMouseLeave = () => {
		closeTimeoutRef.current = setTimeout(() => {
			setIsOpen(false);
		}, closeDelay);
	};

	const handleMouseEnter = () => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
		setIsOpen(true);
	};

	useEffect(() => {
		return () => {
			if (closeTimeoutRef.current) {
				clearTimeout(closeTimeoutRef.current);
			}
		};
	}, []);

	return {
		isOpen,
		parentRef,
		childRef,
		handleMouseEnter,
		handleMouseLeave,
	};
}
