import { createContext, useContext, useState } from "react";

interface DashboardSearchContextType {
	searchTerm: string;
	setSearchTerm: (term: string) => void;
}

const DashboardSearchContext = createContext<
	DashboardSearchContextType | undefined
>(undefined);

interface DashboardSearchProviderProps {
	children: React.ReactNode;
}

export function DashboardSearchProvider({
	children,
}: DashboardSearchProviderProps) {
	const [searchTerm, setSearchTerm] = useState("");

	return (
		<DashboardSearchContext.Provider
			value={{
				searchTerm,
				setSearchTerm,
			}}
		>
			{children}
		</DashboardSearchContext.Provider>
	);
}

export function useDashboardSearch() {
	const context = useContext(DashboardSearchContext);
	if (context === undefined) {
		throw new Error(
			"useDashboardSearch must be used within a DashboardSearchProvider",
		);
	}
	return context;
}
