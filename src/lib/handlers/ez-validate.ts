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
				// do nothing
			}
		}

		const result: EZFailure<TSchema, Awaited<EExtra>> = {
			success: false,
			errors: fieldErrors,
			formErrors: flattened.formErrors,
			returns
		};

		try {
			await options?.onSettled?.(result);
		} catch {
			// do nothing
		}

		return result;
	}

	let returns = undefined as unknown as Awaited<SExtra>;
	if (options?.onSuccess) {
		try {
			returns = await options.onSuccess(validated.data);
		} catch {
			// do nothing
		}
	}

	const result: EZSuccess<TSchema, Awaited<SExtra>> = {
		success: true,
		data: stripFiles(validated.data),
		returns
	};

	try {
		await options?.onSettled?.(result);
	} catch {
		// do not throw from settled
	}

	return result;
}