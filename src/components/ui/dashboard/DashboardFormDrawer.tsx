import type { ReactNode } from "react";
import { Button } from "~/components/ui/shared/Button";
import {
	Drawer,
	DrawerBody,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "~/components/ui/shared/Drawer";

interface DashboardFormDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	formId: string;
	isSubmitting: boolean;
	submitButtonText: string;
	submittingText: string;
	onCancel: () => void;
	error?: string;
	children: ReactNode;
	/**
	 * Layout mode:
	 * - "two-column": Grid with 2 columns (for products, complex forms)
	 * - "single-column": Single column layout (for simpler forms like blog posts)
	 */
	layout?: "two-column" | "single-column";
	/**
	 * Optional: Use full width drawer (defaults to true for consistency)
	 */
	fullWidth?: boolean;
}

export function DashboardFormDrawer({
	isOpen,
	onOpenChange,
	title,
	formId,
	isSubmitting,
	submitButtonText,
	submittingText,
	onCancel,
	error,
	children,
	layout = "two-column",
	fullWidth = true,
}: DashboardFormDrawerProps) {
	return (
		<Drawer open={isOpen} onOpenChange={onOpenChange}>
			<DrawerContent width={fullWidth ? "full" : undefined}>
				<DrawerHeader className="px-4 sm:px-6 lg:px-8">
					<DrawerTitle>{title}</DrawerTitle>
				</DrawerHeader>

				<DrawerBody className="w-full p-0">
					{error && (
						<div className="bg-destructive/20 border border-destructive text-destructive-foreground px-4 sm:px-6 lg:px-8 py-3 mb-4">
							{error}
						</div>
					)}
					<div
						className={
							layout === "two-column"
								? "grid grid-cols-1 lg:grid-cols-2 gap-4"
								: "space-y-4 px-4 sm:px-6 lg:px-8"
						}
					>
						{children}
					</div>
				</DrawerBody>

				<DrawerFooter className="border-t border-border bg-background px-4 sm:px-6 lg:px-8">
					<div className="flex justify-end space-x-2">
						<Button variant="secondary" type="button" onClick={onCancel}>
							Отмена
						</Button>
						<Button
							variant="green"
							type="submit"
							form={formId}
							disabled={isSubmitting}
						>
							{isSubmitting ? submittingText : submitButtonText}
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
