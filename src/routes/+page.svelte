<script lang="ts">
	import { ezForm, ezErrors } from '$lib/index.js';
	import { exampleForm } from './example.remote.js';

	let user = $state([
		{
			username: 'John Doe',
			password: 'asdgasdga',
			tags: ['tag1', 'tag2']
		}
	]);
	let count = $state(0);
	const form = ezForm(exampleForm, {
		onSuccess: async (result) => {
			count += 1;
			console.log(result.returns.message);
		},
		onError: (error) => {
			count += 1;
			console.error('Form submission error:', error);
		},
		onSettled: (r) => {
			//	count += 1;
			console.log('settled');
		},
		append: {
			user: () => user
		}
	});
	let { errors, formErrors } = $derived(ezErrors(exampleForm));

	$inspect(errors);
</script>

<form enctype="multipart/form-data" {...form}>
	<input type="text" name="name" placeholder="Name" />
	<input name="file" type="file" />
	{#if errors?.name}
		<span class="error">{errors.name}</span>
	{/if}

	{#if errors?.file}
		<span class="error">{errors.file}</span>
	{/if}

	<button>Submit</button>
</form>

{count}
