import { toast } from "sonner";

interface SubmitHandlerOptions<T = unknown> {
	/**
	 * The async function to call for submission
	 */
	onSubmit: (data: T) => Promise<void>;
	/**
	 * Success message to show in toast
	 */
	successMessage: string;
	/**
	 * Optional: Custom error message handler
	 */
	formatError?: (error: unknown) => string;
	/**
	 * Optional: Callback after successful submission
	 */
	onSuccess?: () => void;
	/**
	 * Optional: Callback after error
	 */
	onError?: (error: string) => void;
}

/**
 * Standardized submit handler for dashboard forms
 * Handles the common pattern of try/catch/finally with toast notifications
 *
 * @param options - Configuration for the submit handler
 * @returns A submit handler function
 *
 * @example
 * ```ts
 * const handleSubmit = useSubmitHandler({
 *   onSubmit: async (data) => {
 *     await createBrand({ data });
 *   },
 *   successMessage: "Brand created successfully!",
 *   onSuccess: () => {
 *     closeDrawer();
 *     refetch();
 *   }
 * });
 * ```
 */
export function useSubmitHandler<T = unknown>(
	options: SubmitHandlerOptions<T>,
) {
	const {
		onSubmit,
		successMessage,
		formatError = (error: unknown) =>
			error instanceof Error ? error.message : "An error occurred",
		onSuccess,
		onError,
	} = options;

	const handleSubmit = async (data: T) => {
		try {
			await onSubmit(data);
			toast.success(successMessage);
			onSuccess?.();
		} catch (err) {
			const errorMessage = formatError(err);
			toast.error(errorMessage);
			onError?.(errorMessage);
			throw err; // Re-throw so caller can handle if needed
		}
	};

	return handleSubmit;
}

/**
 * Factory function to create a submit handler with form event handling
 * Wraps useSubmitHandler to handle React form events
 *
 * @example
 * ```ts
 * const handleFormSubmit = createFormSubmitHandler({
 *   getData: () => formData,
 *   onSubmit: async (data) => await createBrand({ data }),
 *   successMessage: "Brand created!",
 *   onSuccess: () => { closeDrawer(); refetch(); }
 * });
 *
 * // Use in JSX:
 * <form onSubmit={handleFormSubmit}>
 * ```
 */
export function createFormSubmitHandler<T>(
	options: SubmitHandlerOptions<T> & {
		getData: () => T;
	},
) {
	return async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const submitHandler = useSubmitHandler(options);
		const data = options.getData();
		await submitHandler(data);
	};
}
