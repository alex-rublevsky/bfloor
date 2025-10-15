import { Skeleton } from "~/components/ui/dashboard/skeleton";

export function CartNavSkeleton() {
	return (
		<div className="fixed bottom-3 right-3 z-50">
			<Skeleton className="w-[2.6rem] h-[2.6rem] md:w-[3.2rem] md:h-[3.2rem] rounded-full" />
		</div>
	);
}
