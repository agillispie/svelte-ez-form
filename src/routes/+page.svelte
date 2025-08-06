<script lang="ts">
	import { ezForm, ezErrors } from 'svelte-ez-form';
	import { exampleForm } from './example.remote.js';

	let someObject = {
		name: 'John Doe',
		email: ''
	};

	const form = ezForm(exampleForm, {
		onSuccess: async (result) => {
			console.log('Form submitted successfully:', result);
		},
		onError: (error) => {
			console.error('Form submission error:', error);
		},
		append: {
			...someObject
		}
	});
	let { errors } = $derived(ezErrors(exampleForm));
</script>

<form {...form}>
	<input type="text" name="name" placeholder="Name" />
	{#if errors?.name}
		<span class="error">{errors.name}</span>
	{/if}
</form>
