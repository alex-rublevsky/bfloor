import { useState } from "react";

interface UseFormHandlersOptions {
	/**
	 * Callback when slug field is manually edited
	 * Used to disable auto-slug generation
	 */
	onSlugChange?: () => void;
}

/**
 * Generic form handlers hook for dashboard CRUD forms
 * Handles common form input changes including text, checkboxes, and selects
 *
 * @param initialValues - Initial form state
 * @param options - Optional callbacks for special field handling
 * @returns Form state and handlers
 *
 * @example
 * ```ts
 * const { formData, handleChange, resetForm } = useFormHandlers({
 *   name: "",
 *   slug: "",
 *   isActive: true
 * }, {
 *   onSlugChange: () => setIsAutoSlug(false)
 * });
 * ```
 */
export function useFormHandlers<T extends object>(
	initialValues: T,
	options?: UseFormHandlersOptions,
) {
	const [formData, setFormData] = useState<T>(initialValues);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value, type } = e.target;
		const checked = (e.target as HTMLInputElement).checked;

		// Handle slug field change - notify parent to disable auto-slug
		if (name === "slug" && options?.onSlugChange) {
			options.onSlugChange();
		}

		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const resetForm = () => {
		setFormData(initialValues);
	};

	const updateField = <K extends keyof T>(field: K, value: T[K]) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	return {
		formData,
		setFormData,
		handleChange,
		resetForm,
		updateField,
	};
}
