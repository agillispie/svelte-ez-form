import type { ZodFlattenedError } from 'zod';

type ValidationSuccess<T> = {
	success: true;
	data: T;
};

type ValidationFailure<T> = {
	success: false;
	errors: ZodFlattenedError<T>['fieldErrors'];
	formErrors?: ZodFlattenedError<T>['formErrors'];
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure<T>;
