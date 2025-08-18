import { formDataToObject } from '$lib/helpers/form-to-object.js';
import type { z, ZodTypeAny } from 'zod';

function stripFiles<T>(obj: T): T {
	if (obj instanceof File) {
		return obj.name as unknown as T; // replace file with name
	}
	if (obj instanceof Blob) {
		return '[blob]' as unknown as T; // or whatever placeholder you want
	}
	if (Array.isArray(obj)) {
		return obj.map((item) => stripFiles(item)) as unknown as T;
	}
	if (obj && typeof obj === 'object') {
		return Object.fromEntries(
			Object.entries(obj).map(([k, v]) => [k, stripFiles(v)])
		) as T;
	}
	return obj;
}

// ---------- Types

type FieldErrors<TSchema extends ZodTypeAny> = {
	[P in keyof z.output<TSchema>]?: string[] | undefined;
};

export type EZSuccess<TSchema extends ZodTypeAny, SExtra> = {
	success: true;
	data: z.output<TSchema>;
	returns: SExtra;
};

class EZValidationError<
	TSchema extends ZodTypeAny,
	EExtra
> extends Error {
	public readonly fieldErrors: FieldErrors<TSchema>;
	public readonly formErrors: string[];
	public readonly returns?: EExtra;

	constructor(args: {
		fieldErrors?: FieldErrors<TSchema>;
		formErrors?: string[];
		returns?: EExtra;
		message?: string;
	}) {
		super(args.message ?? 'EZValidationError');
		this.fieldErrors = (args.fieldErrors ?? {}) as FieldErrors<TSchema>;
		this.formErrors = args.formErrors ?? [];
		this.returns = args.returns;
	}
}

export type EZFailure<TSchema extends ZodTypeAny, EExtra> = {
	success: false;
	errors: FieldErrors<TSchema>;
	formErrors: string[];
	returns: EExtra;
};

export type EZValidateOptions<
	TSchema extends ZodTypeAny,
	SExtra = undefined,
	EExtra = undefined
> = {
	onSuccess?: (data: z.output<TSchema>) => SExtra | Promise<SExtra>;
	onError?: (errors: FieldErrors<TSchema>) => EExtra | Promise<EExtra>;
	onSettled?: (
		result:
			| EZSuccess<TSchema, Awaited<SExtra>>
			| EZFailure<TSchema, Awaited<EExtra>>
	) => void | Promise<void>;
};


export function ezFail<TSchema extends ZodTypeAny, EExtra = unknown>(args: {
	fieldErrors?: FieldErrors<TSchema>;
	formErrors?: string[];
	returns?: EExtra;
	message?: string;
}): never {
	throw new EZValidationError<TSchema, EExtra>(args);
}



export async function ezValidate<
	TSchema extends ZodTypeAny,
	SExtra = undefined,
	EExtra = undefined
>(
	schema: TSchema,
	formData: FormData,
	options?: EZValidateOptions<TSchema, SExtra, EExtra>
): Promise<
	| EZSuccess<TSchema, Awaited<SExtra>>
	| EZFailure<TSchema, Awaited<EExtra>>
> {
	const raw = formDataToObject(formData);
	const validated = schema.safeParse(raw);


	if (!validated.success) {
		const flattened = validated.error.flatten();
		const fieldErrors = flattened.fieldErrors as FieldErrors<TSchema>;

		let returns = undefined as unknown as Awaited<EExtra>;
		if (options?.onError) {
			try {
				returns = await options.onError(fieldErrors);
			} catch {

			}
		}

		const failResult: EZFailure<TSchema, Awaited<EExtra>> = {
			success: false,
			errors: fieldErrors,
			formErrors: flattened.formErrors,
			returns
		};

		try {
			await options?.onSettled?.(failResult);
		} catch {

		}

		return failResult;
	}


	const parsed = validated.data;


	try {
		let returns = undefined as unknown as Awaited<SExtra>;
		if (options?.onSuccess) {
			returns = await options.onSuccess(parsed);
		}

		const ok: EZSuccess<TSchema, Awaited<SExtra>> = {
			success: true,
			data: stripFiles(parsed),
			returns
		};

		try {
			await options?.onSettled?.(ok);
		} catch {

		}
		return ok;
	} catch (err) {

		if (err instanceof EZValidationError) {
			const fieldErrors = err.fieldErrors as FieldErrors<TSchema>;

			let returns = (err.returns ??
				(undefined as unknown)) as Awaited<EExtra>;


			if (options?.onError) {
				try {

					const res = await options.onError(fieldErrors);
					if (typeof res !== 'undefined') returns = res as Awaited<EExtra>;
				} catch {

				}
			}

			const failResult: EZFailure<TSchema, Awaited<EExtra>> = {
				success: false,
				errors: fieldErrors,
				formErrors: err.formErrors,
				returns
			};

			try {
				await options?.onSettled?.(failResult);
			} catch {

			}

			return failResult;
		}

		// Unknown error: convert to a generic failure
		const genericFieldErrors = {} as FieldErrors<TSchema>;
		let returns = undefined as unknown as Awaited<EExtra>;

		if (options?.onError) {
			try {
				returns = await options.onError(genericFieldErrors);
			} catch {

			}
		}

		const failResult: EZFailure<TSchema, Awaited<EExtra>> = {
			success: false,
			errors: genericFieldErrors,
			formErrors: ['Unexpected error'],
			returns
		};

		try {
			await options?.onSettled?.(failResult);
		} catch {

		}

		return failResult;
	}
}