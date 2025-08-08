# svelte-ez-form

## This is still in early development, use at your own risk in production environments.

A simple and powerful form handling library for SvelteKit remote forms with Zod schema validation built in.

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
- **SvelteKit** with remote functions enabled
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
  return await ezValidate(schema, data, {
    onSuccess: (validated) => {
      console.log('Validation successful:', validated);
      // Perform additional server-side actions on success
      // ex: query.refresh()
    },
    onError: (errors) => {
      console.log('Validation failed:', errors);
      // Handle validation errors on the server
    }
  });
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

### `ezValidate(schema, formData, options?)`

Validates form data against a Zod schema with optional server-side hooks.

**Parameters:**
- `schema` - A Zod schema to validate against
- `formData` - The FormData object from the request
- `options` - Optional configuration object for server-side hooks

**Options:**
```typescript
type EZValidateOptions<TSchema> = {
  onSuccess?: (resultData: z.infer<TSchema>) => Promise<void> | void;
  onError?: (errors: Record<string, string[]>) => Promise<void> | void;
};
```

**Returns:**
- Promise that resolves to:
  - Success: `{ success: true, data: T }`
  - Error: `{ success: false, errors: Record<string, string[]>, formErrors?: string[] }`

**Example with hooks:**
```typescript
const result = await ezValidate(schema, formData, {
  onSuccess: async (data) => {
    // Save to database, send emails, etc.
    await saveUserToDatabase(data);
    await sendWelcomeEmail(data.email);
  },
  onError: async (errors) => {
    // Log validation errors, analytics, etc.
    await logValidationErrors(errors);
  }
});
```

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

## Server-Side Hooks with `ezValidate`

The `ezValidate` function now supports server-side hooks that execute during validation. These hooks allow you to perform additional server-side operations when validation succeeds or fails.

### Success Hook

The `onSuccess` hook executes when validation passes:

```typescript
export const createUserForm = form(async (data) => {
  return await ezValidate(userSchema, data, {
    onSuccess: async (validatedData) => {
      // Save to database
      const user = await db.users.create(validatedData);
      
      // Send welcome email
      await emailService.sendWelcome(user.email);
      
      // Log successful registration
      console.log(`User ${user.id} created successfully`);

      await someQuery.refresh()
    }
  });
});
```

### Error Hook

The `onError` hook executes when validation fails:

```typescript
export const loginForm = form(async (data) => {
  return await ezValidate(loginSchema, data, {
    onError: async (errors) => {
      // Log failed validation attempts
      await auditLog.logFailedValidation({
        timestamp: new Date(),
        errors,
        ip: request.ip
      });
      
      // Track analytics
      analytics.track('form_validation_failed', { errors });
    }
  });
});
```

### Combined Usage

```typescript
export const updateProfileForm = form(async (data) => {
  return await ezValidate(profileSchema, data, {
    onSuccess: async (validatedData) => {
      await db.profiles.update(userId, validatedData);
      await cacheService.invalidateUser(userId);
    },
    onError: async (errors) => {
      await logger.warn('Profile update validation failed', { userId, errors });
    }
  });
});
```

## Using the `append` Option

The `append` option allows you to automatically add extra data to your form submissions without manually adding hidden inputs. This is particularly useful for:

- Adding user context (user ID, session data)
- Including timestamps
- Appending metadata or configuration
- Adding authentication tokens
- Reactive variables like `$state()` and `$derived()` must be retrieved using a closure

### Basic Usage

```typescript
let userContext = {
  userId: '12345',
  timestamp: new Date().toISOString()
};

let userName = $derived(users[userContext['userId']])

const form = ezForm(exampleForm, {
  append: {
    ...userContext,
    action: 'create',
    // since userName is a reactive variable we have to use a closure so we get the most up to date value when the form is submitted.
    userName: () => userName
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

  let someReactiveState = $state("")

  const enhanceForm = ezForm(form, {
    onSuccess: async (result) => {
      toast.success('Profile updated successfully!');
      await goto('/dashboard');
    },
    onError: (result) => {
      toast.error('Please fix the errors and try again');
    },
    append: {
      timestamp: new Date().toISOString(),
      append: {
        someReactiveState: () => someReactiveState
      }
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

// Type-safe async validation result
const result: ValidationResult<User> = await ezValidate(userSchema, formData, {
  onSuccess: (data: User) => {
    // data is fully typed as User
    console.log(`Welcome ${data.name}!`);
  },
  onError: (errors: Record<keyof User, string[]>) => {
    // errors are typed based on the schema
    console.log('Validation errors:', errors);
  }
});

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

Contributions are welcome! Please feel free to submit a [Pull Request]('https://github.com/agillispie/svelte-ez-form').


## License

MIT

## Changelog

### 0.0.6
- Link GH repo

### 0.0.5
- Allow passing reactive variables to append via closures

### 0.0.4
- Validated results will now automatically parse JSON data

### 0.0.3
- **BREAKING**: `ezValidate` is now async and returns a `Promise<ValidationResult<T>>`
- Added server-side hooks: `onSuccess` and `onError` options for `ezValidate`

### 0.0.2
- Enhanced TypeScript support for async validation
- Improved server-side integration with SvelteKit remote forms

### 0.0.1
- Initial release
- Basic form validation with Zod
- Error handling utilities
- TypeScript support
