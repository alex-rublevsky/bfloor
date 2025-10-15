import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";

// Custom cursor variants
type CursorVariant =
	| "default"
	| "small"
	| "enlarge"
	| "link"
	| "add"
	| "block"
	| "visitWebsite"
	| "shrink"
	| "hidden";

// Context type definition
interface CursorContextType {
	variant: CursorVariant;
	setVariant: (variant: CursorVariant) => void;
	isVisible: boolean;
	setIsVisible: (visible: boolean) => void;
}

interface CursorContextProviderProps {
	children: ReactNode;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

// Safe hook that works even when not wrapped in a provider (for mobile)
export const useCursorContext = (): CursorContextType => {
	const context = useContext(CursorContext);
	if (!context) {
		// Return a no-op implementation for mobile/cases without provider
		return {
			variant: "default",
			setVariant: () => {}, // No-op function
			isVisible: false,
			setIsVisible: () => {}, // No-op function
		};
	}
	return context;
};

export const CursorContextProvider = ({
	children,
}: CursorContextProviderProps) => {
	const [variant, setVariant] = useState<CursorVariant>("hidden");
	const [isVisible, setIsVisible] = useState(false);

	return (
		<CursorContext.Provider
			value={{
				variant,
				setVariant,
				isVisible,
				setIsVisible,
			}}
		>
			{children}
		</CursorContext.Provider>
	);
};

// Unified cursor hover hook that handles all cursor interaction scenarios
export const useCursorHover = (
	cursorType: CursorVariant = "small",
	disableCursor: boolean = false,
) => {
	const { setVariant } = useCursorContext();

	const handleMouseEnter = useCallback(
		<T extends React.MouseEvent<Element>>(originalHandler?: (e: T) => void) =>
			(e: T) => {
				if (!disableCursor) {
					setVariant(cursorType);
				}
				originalHandler?.(e);
			},
		[disableCursor, setVariant, cursorType],
	);

	const handleMouseLeave = useCallback(
		<T extends React.MouseEvent<Element>>(originalHandler?: (e: T) => void) =>
			(e: T) => {
				if (!disableCursor) {
					setVariant("default");
				}
				originalHandler?.(e);
			},
		[disableCursor, setVariant],
	);

	return { handleMouseEnter, handleMouseLeave };
};
