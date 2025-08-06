import { formDataToObject } from '$lib/helpers/form-to-object.js';
import type { ValidationResult } from '$lib/types/types.js';
import type { z, ZodTypeAny } from 'zod';

function ezValidate<TSchema extends ZodTypeAny>(
	schema: TSchema,
	formData: FormData
): ValidationResult<z.infer<TSchema>> {
	const raw = formDataToObject(formData);
	const result = schema.safeParse(raw);

	if (!result.success) {
		const flattened = result.error.flatten();
		return {
			success: false,
			errors: flattened.fieldErrors,
			formErrors: flattened.formErrors
		};
	}

	return {
		success: true,
		data: result.data
	};
}

export { ezValidate };
