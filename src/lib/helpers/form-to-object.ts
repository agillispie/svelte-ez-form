function formDataToObject(fd: FormData): Record<string, FormDataEntryValue> {
	return Object.fromEntries(fd) as Record<string, FormDataEntryValue>;
}

export { formDataToObject };
