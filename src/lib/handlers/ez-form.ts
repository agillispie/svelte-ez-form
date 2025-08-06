import type { ValidationResult } from '$lib/types/types.js';
import type { RemoteForm } from '@sveltejs/kit';

export type EZFormOptions<T> = {
	// optional hooks – each may be sync or async
	onSuccess?: (result: Extract<ValidationResult<T>, { success: true }>) => void | Promise<void>;
	onError?: (result: Extract<ValidationResult<T>, { success: false }>) => void | Promise<void>;
	onSettled?: (result: ValidationResult<T> | undefined) => void | Promise<void>;
	append?: Record<string, FormDataEntryValue>;
	reset?: {
		onError?: boolean;
		onSuccess?: boolean;
	};
};

export function ezForm<T>(rf: RemoteForm<ValidationResult<T>>, options?: EZFormOptions<T>) {
	const originalEnhance = rf.enhance.bind(rf);

	const attrs = originalEnhance(async (e) => {
		if (options?.append) {
			for (const [k, v] of Object.entries(options.append)) e.data.set(k, v);
		}

		await e.submit();

		const res = rf.result as ValidationResult<T> | undefined;

		if (res && res.success) {
			await options?.onSuccess?.(res);
			if (options?.reset?.onSuccess) e.form.reset();
		} else if (res && !res.success) {
			await options?.onError?.(res);
			if (options?.reset?.onError) e.form.reset();
		}

		await options?.onSettled?.(res);
	});

	// Keep the exact shape that `enhance` returns (method, action, onsubmit)
	return attrs satisfies ReturnType<typeof rf.enhance>;
}
