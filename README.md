# svelte-ez-form

A simple and powerful form handling library for SvelteKit that makes form validation and error handling effortless using Zod schemas.

## Features

- **Simple API** - Minimal boilerplate with maximum functionality
- **Type-safe** - Full TypeScript support with Zod schema validation
- **SvelteKit integration** - Built specifically for SvelteKit's form actions
- **Automatic error handling** - Easy access to field and form errors
- **Flexible hooks** - Custom success, error, and settled callbacks
- **Form utilities** - Built-in form reset and data appending

## Installation

```bash
npm install svelte-ez-form
```

```bash
pnpm add svelte-ez-form
```

```bash
yarn add svelte-ez-form
```

## Prerequisites

This library requires:
- **Svelte 5.0+**
- **SvelteKit** for form actions
- **Zod** for schema validation (peer dependency)

## Quick Start

### 1. Define your schema and remote form

```typescript
// src/routes/example.remote.ts
import { form } from '$app/server';
import { ezValidate } from 'svelte-ez-form';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name must be present')
});

export const exampleForm = form(async (data) => {
  return ezValidate(schema, data);
});
```

### 2. Use in your Svelte component

```svelte
<!-- src/routes/+page.svelte -->
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
      ...someObject // Append additional data to form submission
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
```

## API Reference

### `ezValidate(schema, formData)`

Validates form data against a Zod schema.

**Parameters:**
- `schema` - A Zod schema to validate against
- `formData` - The FormData object from the request

**Returns:**
- Success: `{ success: true, data: T }`
- Error: `{ success: false, errors: Record<string, string[]>, formErrors?: string[] }`

### `ezForm(form, options?)`

Enhances SvelteKit's form handling with additional functionality.

**Parameters:**
- `form` - The SvelteKit RemoteForm object
- `options` - Optional configuration object

**Options:**
```typescript
type EZFormOptions<T> = {
  onSuccess?: (result: ValidationResult<T>) => void | Promise<void>;
  onError?: (result: ValidationResult<T>) => void | Promise<void>;
  onSettled?: (result: ValidationResult<T> | undefined) => void | Promise<void>;
  append?: Record<string, FormDataEntryValue>;
  reset?: {
    onError?: boolean;
    onSuccess?: boolean;
  };
};
```

### `ezErrors(form)`

Extracts errors from the form result for easy access in templates.

**Parameters:**
- `form` - The SvelteKit RemoteForm object

**Returns:**
```typescript
{
  errors: Record<string, string[]> | undefined;
  formErrors: string[] | undefined;
}
```

## Using the `append` Option

The `append` option allows you to automatically add extra data to your form submissions without manually adding hidden inputs. This is particularly useful for:

- Adding user context (user ID, session data)
- Including timestamps
- Appending metadata or configuration
- Adding authentication tokens

### Basic Usage

```typescript
let userContext = {
  userId: '12345',
  timestamp: new Date().toISOString()
};

const form = ezForm(exampleForm, {
  append: {
    ...userContext,
    action: 'create'
  }
});
```

### Dynamic Append Data

```typescript
let someObject = {
  name: 'John Doe',
  email: 'john@example.com'
};

const form = ezForm(exampleForm, {
  append: {
    ...someObject, // Spread existing object
    submittedAt: new Date().toISOString(),
    browserInfo: navigator.userAgent
  }
});
```

The appended data will be available in your form validation alongside the regular form fields:

```typescript
// In your remote form
const schema = z.object({
  name: z.string().min(1, 'Name required'),
  // These will be automatically appended
  userId: z.string().optional(),
  timestamp: z.string().optional(),
  action: z.string().optional()
});
```

## Advanced Examples

### With Custom Hooks

```svelte
<script lang="ts">
  import { ezForm } from 'svelte-ez-form';
  import { goto } from '$app/navigation';
  import { toast } from '$lib/toast';

  const enhanceForm = ezForm(form, {
    onSuccess: async (result) => {
      toast.success('Profile updated successfully!');
      await goto('/dashboard');
    },
    onError: (result) => {
      toast.error('Please fix the errors and try again');
    },
    append: {
      timestamp: new Date().toISOString()
    },
    reset: {
      onSuccess: true
    }
  });
</script>
```

## TypeScript Support

svelte-ez-form is built with TypeScript and provides full type safety:

```typescript
import { z } from 'zod';
import type { ValidationResult } from 'svelte-ez-form';

const userSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

type User = z.infer<typeof userSchema>;

// Type-safe validation result
const result: ValidationResult<User> = ezValidate(userSchema, formData);

if (result.success) {
  // result.data is typed as User
  console.log(result.data.name, result.data.email);
}
```

## Error Handling Patterns

### Field-level Errors (Single Error Display)

Based on your actual usage pattern:

```svelte
{#if errors?.name}
  <span class="error">{errors.name}</span>
{/if}
```

### Field-level Errors (First Error Only)

```svelte
{#if errors?.fieldName}
  <span class="error">{errors.fieldName[0]}</span>
{/if}
```

### All Errors for a Field

```svelte
{#if errors?.fieldName}
  {#each errors.fieldName as error}
    <span class="error">{error}</span>
  {/each}
{/if}
```

### Form-level Errors

```svelte
{#if formErrors}
  <div class="form-errors">
    {#each formErrors as error}
      <div class="error">{error}</div>
    {/each}
  </div>
{/if}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Changelog

### 0.0.1
- Initial release
- Basic form validation with Zod
- Error handling utilities
- TypeScript support
