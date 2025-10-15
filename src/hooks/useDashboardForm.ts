import { useDashboardAction } from "~/hooks/useDashboardAction";
import { useDashboardCRUD } from "~/hooks/useDashboardCRUD";
import { useFormHandlers } from "~/hooks/useFormHandlers";

/**
 * All-in-one hook that combines CRUD operations and form handling for dashboard pages
 * Provides complete state management for create/edit/delete operations
 *
 * @param initialFormData - Initial state for both create and edit forms
 * @returns Object with all CRUD operations, form handlers, and states
 *
 * @example
 * ```ts
 * const dashboard = useDashboardForm<BrandFormData>({
 *   name: "",
 *   slug: "",
 *   logo: "",
 *   isActive: true,
 * });
 *
 * // Use in component:
 * <DashboardFormDrawer
 *   isOpen={dashboard.crud.showCreateDrawer}
 *   onOpenChange={dashboard.crud.setShowCreateDrawer}
 *   isSubmitting={dashboard.crud.isSubmitting}
 *   error={dashboard.crud.error}
 * >
 *   <Input
 *     value={dashboard.createForm.formData.name}
 *     onChange={dashboard.createForm.handleChange}
 *   />
 * </DashboardFormDrawer>
 *
 * // Listen to navbar action button:
 * dashboard.listenToActionButton();
 * ```
 */
interface UseDashboardFormOptions {
	/**
	 * Enable listening to dashboard action button (FAB) clicks
	 * When true, the navbar action button will open the create drawer
	 */
	listenToActionButton?: boolean;
}

export function useDashboardForm<T extends object>(
	initialFormData: T,
	options: UseDashboardFormOptions = {},
) {
	const crud = useDashboardCRUD();

	const createForm = useFormHandlers<T>(initialFormData);
	const editForm = useFormHandlers<T>(initialFormData);

	// Always call the hook, but conditionally enable the listener
	useDashboardAction(() => {
		if (options.listenToActionButton) {
			crud.openCreateDrawer();
		}
	});

	return {
		crud,
		createForm,
		editForm,
	};
}
