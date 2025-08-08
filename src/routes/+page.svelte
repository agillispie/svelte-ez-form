<script lang="ts">
	import { ezForm, ezErrors } from '$lib/index.js';
	import { exampleForm } from './example.remote.js';

	let user = [
		{
			username: 'John Doe',
			password: 'asdgasdga',
			tags: ['tag1', 'tag2']
		}
	];

	const form = ezForm(exampleForm, {
		onSuccess: async (result) => {
			console.log('Form submitted successfully:', result);
		},
		onError: (error) => {
			console.error('Form submission error:', error);
		},
		append: {
			user
		}
	});
	let { errors } = $derived(ezErrors(exampleForm));
</script>

<form {...form}>
	<input type="text" name="name" placeholder="Name" />
	{#if errors?.name}
		<span class="error">{errors.name}</span>
	{/if}

	<button>Submit</button>
</form>
