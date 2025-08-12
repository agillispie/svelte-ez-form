
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

// Minimal shape your ValidationResult must satisfy
export type ResultLike =
	| { success: true; data: unknown; returns: unknown }
	| { success: false; errors: unknown; formErrors: unknown; returns: unknown };

// Conditional helpers for the failure branch
export type FailureErrors<V> = V extends { success: false; errors: infer E } ? E : never;
export type FailureFormErrors<V> = V extends { success: false; formErrors: infer F } ? F : never;
export type FailureReturns<V> = V extends { success: false; returns: infer R } ? R : never;





