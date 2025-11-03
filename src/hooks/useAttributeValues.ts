import { useQuery } from "@tanstack/react-query";
import { attributeValuesQueryOptions } from "~/lib/queryOptions";

/**
 * Hook to fetch standardized values for a specific attribute
 */
export function useAttributeValues(attributeId: number | null) {
	return useQuery({
		...attributeValuesQueryOptions(attributeId ?? 0),
		enabled: attributeId !== null && attributeId > 0,
	});
}


