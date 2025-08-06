import { formDataToObject } from '$lib/helpers/form-to-object.js';
import type { ValidationResult } from '$lib/types/types.js';
import type { z, ZodTypeAny } from 'zod';

async function ezValidate<TSchema extends ZodTypeAny>(
	schema: TSchema,
	formData: FormData,
	options?: {
		onSuccess?: (resultData: z.core.output<TSchema>) => Promise<void> | void
		onError?: (errors: { [P in keyof z.core.output<TSchema>]?: string[] | undefined; }) => Promise<void> | void
	}
): Promise<ValidationResult<z.infer<TSchema>>> {
	const raw = formDataToObject(formData);
	const result = schema.safeParse(raw);

	if (!result.success) {
		const flattened = result.error.flatten();
		await options?.onError?.(flattened?.fieldErrors)
		return {
			success: false,
			errors: flattened.fieldErrors,
			formErrors: flattened.formErrors
		};
	}
	await options?.onSuccess?.(result.data)
	return {
		success: true,
		data: result.data
	};
}

export { ezValidate };
