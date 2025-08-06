import type { ValidationResult } from '$lib/types/types.js';
import type { RemoteForm } from '@sveltejs/kit';

type FailureOf<T> = Extract<ValidationResult<T>, { success: false }>;
type ErrorsOf<T> = FailureOf<T>['errors'];
type FormErrorsOf<T> = FailureOf<T>['formErrors'];

export function ezErrors<T>(form: RemoteForm<ValidationResult<T>>): {
	errors: ErrorsOf<T> | undefined;
	formErrors: FormErrorsOf<T> | undefined;
} {
	const r = form.result;
	if (r && r.success === false) {
		return { errors: r.errors, formErrors: r.formErrors };
	}
	return { errors: undefined, formErrors: undefined };
}
