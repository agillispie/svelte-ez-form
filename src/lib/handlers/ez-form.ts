import type { RemoteForm } from '@sveltejs/kit';

// --- Result shapes (mirror your ezValidate output) ---
export type SuccessResult<TData, SExtra> = {
	success: true;
	data: TData;
	returns: SExtra;
};

export type ErrorResult<TErrors, EExtra> = {
	success: false;
	errors: TErrors;
	formErrors: string[];
	returns: EExtra;
};

export type ValidationResult<
	TData,
	TErrors = Record<string, string[]>,
	SExtra = undefined,
	EExtra = undefined
> = SuccessResult<TData, SExtra> | ErrorResult<TErrors, EExtra>;

// --- Options typed per branch, including returns ---
export type EZFormOptions<
	TData,
	TErrors = Record<string, string[]>,
	SExtra = undefined,
	EExtra = undefined
> = {
	onSuccess?: (
		result: SuccessResult<TData, SExtra>
	) => void | Promise<void>;
	onError?: (
		result: ErrorResult<TErrors, EExtra>
	) => void | Promise<void>;
	onSettled?: (
		result: ValidationResult<TData, TErrors, SExtra, EExtra> | undefined
	) => void | Promise<void>;
	// allow closures for reactive values
	append?: Record<string, unknown | (() => unknown)>;
	reset?: {
		onError?: boolean;
		onSuccess?: boolean;
	};
};

// Keep Blob as Blob; stringify scalars/objects
function toFormDataValue(value: unknown): FormDataEntryValue | Blob {
	if (value instanceof Blob || value instanceof File) return value;
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return JSON.stringify(value);
}

/**
 * ezForm with full type inference for `returns`:
 * - Infers TData/TErrors/SExtra/EExtra from the RemoteForm generic.
 * - Calls the right hook with the right branch type.
 */
export function ezForm<
	TData,
	TErrors = Record<string, string[]>,
	SExtra = undefined,
	EExtra = undefined
>(
	rf: RemoteForm<ValidationResult<TData, TErrors, SExtra, EExtra>>,
	options?: EZFormOptions<TData, TErrors, SExtra, EExtra>
) {
	const originalEnhance = rf.enhance.bind(rf);

	const attrs = originalEnhance(async (e) => {
		if (options?.append) {
			for (const [k, raw] of Object.entries(options.append)) {
				const v = typeof raw === 'function' ? (raw as () => unknown)() : raw;
				e.data.set(k, toFormDataValue(v));
			}
		}

		await e.submit();

		const res = rf.result as ValidationResult<TData, TErrors, SExtra, EExtra> | undefined;

		if (res?.success) {
			await options?.onSuccess?.(res);
			if (options?.reset?.onSuccess) e.form.reset();
		} else if (res && !res.success) {
			await options?.onError?.(res);
			if (options?.reset?.onError) e.form.reset();
		}

		await options?.onSettled?.(res);
	});

	// preserve the exact attribute shape returned by enhance
	return attrs satisfies ReturnType<typeof rf.enhance>;
}