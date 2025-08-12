import type { FailureErrors, FailureFormErrors, FailureReturns, ResultLike } from '$lib/types/types.js';
import type { RemoteForm } from '@sveltejs/kit';


/**
 * Extract errors, formErrors, and error returns (typed to the failure branch).
 */
export function ezErrors<V extends ResultLike>(
	form: RemoteForm<V>
): {
	errors: FailureErrors<V> | undefined;
	formErrors: FailureFormErrors<V> | undefined;
	returns: FailureReturns<V> | undefined;
} {
	const r = form.result as V | undefined;

	if (r && r.success === false) {
		return {
			errors: r.errors as FailureErrors<V>,
			formErrors: r.formErrors as FailureFormErrors<V>,
			returns: r.returns as FailureReturns<V>
		};
		// Note: casts are safe due to the runtime guard r.success === false
	}

	return { errors: undefined, formErrors: undefined, returns: undefined };
}