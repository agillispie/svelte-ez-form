import type { ValidationResult } from '$lib/types/types.js';
import type { RemoteForm } from '@sveltejs/kit';

export type EZFormOptions<T> = {
	onSuccess?: (result: Extract<ValidationResult<T>, { success: true }>) => void | Promise<void>;
	onError?: (result: Extract<ValidationResult<T>, { success: false }>) => void | Promise<void>;
	onSettled?: (result: ValidationResult<T> | undefined) => void | Promise<void>;
	append?: Record<string, unknown>;
	reset?: {
		onError?: boolean;
		onSuccess?: boolean;
	};
};

function toFormDataValue(value: unknown): FormDataEntryValue {

	if (
		value instanceof Blob ||
		value instanceof File ||
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	) {
		return String(value);
	}


	return JSON.stringify(value);
}

export function ezForm<T>(rf: RemoteForm<ValidationResult<T>>, options?: EZFormOptions<T>) {
	const originalEnhance = rf.enhance.bind(rf);

	const attrs = originalEnhance(async (e) => {
		if (options?.append) {
			for (const [k, raw] of Object.entries(options.append)) {
				const v = typeof raw === 'function' ? (raw as () => unknown)() : raw;
				e.data.set(k, toFormDataValue(v));
			}
		}

		await e.submit();

		const res = rf.result as ValidationResult<T> | undefined;

		if (res?.success) {
			await options?.onSuccess?.(res);
			if (options?.reset?.onSuccess) e.form.reset();
		} else if (res && !res.success) {
			await options?.onError?.(res);
			if (options?.reset?.onError) e.form.reset();
		}

		await options?.onSettled?.(res);
	});

	return attrs satisfies ReturnType<typeof rf.enhance>;
}