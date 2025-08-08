function setNestedValue(obj: any, path: string, value: unknown) {
	const segments = path
		.replace(/\[(\w+)\]/g, '.$1') // convert [0] to .0
		.replace(/^\./, '') // remove leading dot
		.split('.');

	let current = obj;
	for (let i = 0; i < segments.length; i++) {
		const key = segments[i];
		const isLast = i === segments.length - 1;

		if (isLast) {
			current[key] = value;
		} else {
			if (!(key in current)) {
				// create array if next is number, else object
				const nextKey = segments[i + 1];
				current[key] = /^\d+$/.test(nextKey) ? [] : {};
			}
			current = current[key];
		}
	}
}



export function formDataToObject(formData: FormData): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const [key, value] of formData.entries()) {
		let parsed: unknown = value;

		if (typeof value === 'string') {
			try {
				parsed = JSON.parse(value);
			} catch {
				parsed = value;
			}
		}

		setNestedValue(result, key, parsed);
	}

	return result;
}