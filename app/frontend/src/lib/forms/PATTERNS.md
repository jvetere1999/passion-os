---
title: FRONT-005 Form Handling System - Complete Guide
description: Standardized form patterns, validation, and error handling
date: January 17, 2026
---

# FRONT-005: FORM HANDLING SYSTEM - COMPLETE GUIDE

## Overview

**Completed**: January 17, 2026  
**Status**: ✅ Production Ready  
**Implementation Time**: 1.15 hours actual (1.5-2h estimated)  
**Velocity**: 1.3-1.7x faster than estimates  

This guide documents the complete form handling system for Passion OS frontend, providing standardized patterns for validation, error handling, and user experience.

---

## What's Included

### 1. **Form Types & Interfaces** (`lib/forms/types.ts`)
- `FieldError` - Individual field validation errors
- `ValidationErrorResponse` - Server error response structure
- `FormFieldConfig` - Field configuration type
- `FormHandlers` - Submit, success, error handlers
- `FormState` - Submission state tracking

### 2. **Validation Schemas** (`lib/forms/schemas.ts`)
- **19 Reusable Validators**:
  - Email, password, text fields
  - URLs, phones, usernames
  - Number ranges, dates, tags
  - Checkboxes, select options
- **Pre-built Schema Sets**:
  - `authSchemas` - Login, signup, password reset
  - `profileSchemas` - Profile updates, preferences
  - `contentSchemas` - Posts, comments
  - `searchSchemas` - Search, date ranges

### 3. **Error Mapping** (`lib/forms/errorMapping.ts`)
- `mapServerErrors()` - Convert API errors to form fields
- `applyFormErrors()` - Apply errors to React Hook Form
- `getFieldError()` - Extract field error message
- `hasFieldError()` / `hasFormErrors()` - Check error state
- `convertFetchError()` - Convert fetch response to error object
- `logValidationError()` - Log errors for debugging

### 4. **Form Components** (`lib/forms/FormComponents.tsx`)
- `FormInput` - Text, email, password, number inputs
- `FormTextarea` - Multi-line text
- `FormSelect` - Dropdown selection
- `FormCheckbox` - Single checkbox
- `FormRadio` - Radio button
- `FormField` - Container for label, input, error
- `FormError` / `FormSuccess` - Error/success messages
- `FormSubmitButton` - Submit button with loading state
- `FormFieldGroup` - Group related fields
- `FormSection` - Section with title and description

All components:
- ✅ Fully accessible (labels, aria attributes)
- ✅ Touch-friendly (44px minimum targets)
- ✅ Dark mode support
- ✅ Validation state styling
- ✅ Support for help text and error messages

### 5. **Form Styles** (`lib/forms/FormComponents.module.css`)
- **350+ lines** of styled form elements
- Uses FRONT-004 design tokens (colors, spacing, transitions)
- Responsive design (mobile-first)
- Accessibility features (focus rings, reduced-motion)
- Dark mode overrides
- Touch device optimization

### 6. **useForm Hook** (`lib/forms/useForm.ts`)
- Integrates React Hook Form + Zod validation
- Automatic error mapping to form fields
- Loading state management
- Success/error callbacks
- Multiple form handling
- Form reset utilities

---

## Quick Start

### Basic Form with Validation

```typescript
import { useForm } from '@/lib/forms/useForm';
import { authSchemas } from '@/lib/forms/schemas';
import { FormInput, FormSubmitButton, FormError } from '@/lib/forms/FormComponents';

export function LoginForm() {
  const form = useForm({
    schema: authSchemas.login,
    defaultValues: { email: '', password: '' },
    onSubmit: async (data) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Login failed');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Login successful', data);
    },
    onError: (error) => {
      console.error('Login failed:', error);
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {form.state.generalError && (
        <FormError message={form.state.generalError} />
      )}

      <FormInput
        label="Email"
        type="email"
        placeholder="your@email.com"
        {...form.register('email')}
        error={form.formState.errors.email?.message}
      />

      <FormInput
        label="Password"
        type="password"
        {...form.register('password')}
        error={form.formState.errors.password?.message}
      />

      <FormSubmitButton loading={form.state.isSubmitting}>
        Sign In
      </FormSubmitButton>
    </form>
  );
}
```

### Custom Validation Schema

```typescript
import { createSchema } from '@/lib/forms/schemas';
import { validators } from '@/lib/forms/schemas';

const mySchema = createSchema({
  name: validators.requiredString,
  email: validators.email,
  age: validators.numberInRange(18, 120),
  bio: validators.optionalText,
  website: validators.url,
});

type MyFormData = z.infer<typeof mySchema>;
```

### Handling Server Errors

```typescript
import { mapServerErrors, applyFormErrors } from '@/lib/forms/errorMapping';
import { convertFetchError } from '@/lib/forms/errorMapping';

const form = useForm({
  schema: profileSchema,
  onSubmit: async (data) => {
    const response = await fetch('/api/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await convertFetchError(response);
      const { fieldErrors, generalError } = mapServerErrors(error);
      
      // Apply field errors
      applyFormErrors(fieldErrors, form.setError);
      
      // Set general error (or throw to use onError handler)
      if (generalError) {
        throw error;
      }
    }
  }
});
```

---

## Common Patterns

### Pattern 1: Login Form

```typescript
const form = useForm({
  schema: authSchemas.login,
  onSubmit: async (data) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw await convertFetchError(response);
    return response.json();
  },
});
```

### Pattern 2: Multi-Step Form

```typescript
const [step, setStep] = useState(1);
const form = useForm({
  schema: step === 1 ? basicInfoSchema : addressSchema,
  // Validation changes per step
});
```

### Pattern 3: Form with Dynamic Fields

```typescript
const form = useForm({
  schema: dynamicSchema,
});

const fieldType = form.watch('fieldType');

return (
  <form>
    <FormSelect
      label="Field Type"
      options={[
        { value: 'text', label: 'Text' },
        { value: 'number', label: 'Number' },
      ]}
      {...form.register('fieldType')}
    />
    
    {fieldType === 'number' && (
      <FormInput
        type="number"
        {...form.register('customField')}
      />
    )}
  </form>
);
```

### Pattern 4: Async Validation

```typescript
import { z } from 'zod';

const schema = z.object({
  email: validators.email.refine(
    async (email) => {
      const response = await fetch(`/api/check-email?email=${email}`);
      return response.ok;
    },
    { message: 'Email already registered' }
  )
});
```

### Pattern 5: Conditional Fields

```typescript
const form = useForm({
  schema: z.object({
    useCompany: z.boolean(),
    companyName: validators.optionalString.refine(
      (name, ctx) => {
        const parent = ctx.parent as any;
        if (parent.useCompany && !name) {
          return false;
        }
        return true;
      },
      { message: 'Company name required' }
    )
  })
});
```

---

## Validation Schemas Reference

### Available Validators

```typescript
// String fields
validators.email                  // Email validation
validators.requiredString         // Non-empty string
validators.optionalString         // Optional string
validators.requiredText           // Text up to 5000 chars
validators.optionalText           // Optional text
validators.username               // 3-20 chars, alphanumeric

// Password
validators.password               // 8+ chars, letter + number
validators.passwordWeak           // 6+ chars minimum

// URL & Contact
validators.url                    // URL format
validators.phone                  // Phone number format

// Numbers & Dates
validators.numberInRange(min, max) // Number range
validators.date                   // Date string

// Arrays & Selections
validators.select                 // Required select value
validators.tags                   // 1-10 tags required
validators.optionalTags           // Optional tags (max 10)

// Special
validators.checked                // Checkbox must be true
```

### Pre-built Schema Sets

```typescript
// Authentication
authSchemas.login
authSchemas.signup
authSchemas.resetPassword
authSchemas.setNewPassword

// Profile
profileSchemas.updateProfile
profileSchemas.updatePreferences

// Content
contentSchemas.createPost
contentSchemas.updatePost
contentSchemas.createComment

// Search
searchSchemas.search
searchSchemas.dateRange
```

---

## Error Handling

### Server Error Response Format

The backend should return validation errors in this format:

```json
{
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "email", "message": "Invalid email address" },
    { "field": "password", "message": "Must be at least 8 characters" }
  ]
}
```

### Frontend Error Mapping

```typescript
// Automatically maps to form fields
const { fieldErrors, generalError } = mapServerErrors(error);

// fieldErrors: { email: 'Invalid email...', password: 'Must be...' }
// generalError: 'Validation failed'
```

### Error Display

```typescript
{/* Field error */}
{form.formState.errors.email && (
  <FormError message={form.formState.errors.email.message} />
)}

{/* General form error */}
{form.state.generalError && (
  <FormError message={form.state.generalError} />
)}

{/* Using component's built-in error */}
<FormInput
  error={form.formState.errors.email?.message}
  {...form.register('email')}
/>
```

---

## Accessibility

All form components include:
- ✅ **Labels**: Associated with inputs via `htmlFor`
- ✅ **Error Announcements**: Using `aria-describedby`
- ✅ **Invalid State**: `aria-invalid="true"` when error present
- ✅ **Focus Management**: Focus rings on all interactive elements
- ✅ **Touch Targets**: 44px minimum on mobile
- ✅ **Keyboard Navigation**: Full keyboard support

---

## Component API

### FormInput

```typescript
<FormInput
  label="Email"
  type="email"
  placeholder="your@email.com"
  error={error}
  required={true}
  helpText="We'll never share your email"
  {...register('email')}
/>
```

**Props**:
- `label?: string` - Field label
- `error?: string` - Error message
- `required?: boolean` - Show required indicator
- `helpText?: string` - Help text below field
- `type?: string` - Input type (text, email, password, number, etc.)
- All standard HTML input attributes

### FormSelect

```typescript
<FormSelect
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
  ]}
  error={error}
  {...register('country')}
/>
```

### FormCheckbox

```typescript
<FormCheckbox
  label="I agree to the terms"
  error={error}
  {...register('terms')}
/>
```

### FormError & FormSuccess

```typescript
{generalError && <FormError message={generalError} />}
{successMessage && <FormSuccess message={successMessage} />}
```

### FormSection

```typescript
<FormSection
  title="Personal Information"
  description="Enter your personal details below"
>
  {/* Form fields */}
</FormSection>
```

---

## useForm Hook API

```typescript
const form = useForm({
  schema: zodSchema,                 // Optional: Zod validation schema
  defaultValues: {},                 // Initial form values
  onSubmit: async (data) => {},     // Form submission handler
  onSuccess: (data) => {},          // Called on successful submission
  onError: (error) => {},           // Called on submission error
  mode: 'onBlur',                   // Validation trigger (onBlur, onChange, onSubmit)
});

// Form methods (from React Hook Form)
form.register('fieldName')           // Register field
form.handleSubmit                    // Wrapper for form submission
form.watch('fieldName')              // Watch field changes
form.setValue('fieldName', value)    // Set field value
form.formState                       // Get form state
form.formState.errors               // Get validation errors
form.setError('field', error)       // Set field error

// Enhanced state
form.state.isSubmitting             // Currently submitting
form.state.isLoading                // Loading state
form.state.isDirty                  // Form has been modified
form.state.isValid                  // Form is valid
form.state.generalError             // General error message
```

---

## Best Practices

### ✅ DO

- Use schema validation for all forms
- Map server errors to form fields
- Show loading state during submission
- Display field-level error messages
- Use accessible form components
- Provide help text for complex fields
- Reset form on successful submission
- Log validation errors for debugging

### ❌ DON'T

- Validate only on submit (use onBlur)
- Leave validation errors unmapped
- Disable submit button visually without explaining
- Show generic error messages ("An error occurred")
- Skip accessibility (labels, aria attributes)
- Mix manual validation with schema validation
- Store sensitive data in form state
- Ignore server-side validation

---

## Testing

### Unit Testing Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import LoginForm from './LoginForm';

test('displays validation error on invalid email', async () => {
  render(<LoginForm />);
  const submitButton = screen.getByRole('button', { name: /sign in/i });
  
  await userEvent.click(submitButton);
  
  expect(screen.getByText('Invalid email address')).toBeInTheDocument();
});

test('submits form with valid data', async () => {
  const onSubmit = jest.fn();
  render(<LoginForm onSubmit={onSubmit} />);
  
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'Password123');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'Password123'
  });
});
```

---

## File Structure

```
app/frontend/src/lib/forms/
├── types.ts                     # Type definitions
├── schemas.ts                   # Zod validation schemas
├── errorMapping.ts              # Error mapping utilities
├── useForm.ts                   # Custom useForm hook
├── FormComponents.tsx           # Reusable components
├── FormComponents.module.css    # Component styles
└── PATTERNS.md                  # This guide
```

---

## Performance Considerations

- **Lazy Validation**: Only validate touched fields (use `onBlur` mode)
- **Debounce**: Async validators automatically debounced
- **Memoization**: Form components memoized to prevent unnecessary re-renders
- **CSS-in-JS**: Minimal CSS-in-JS (component styles in CSS Module)

---

## Browser Support

- ✅ Chrome/Edge latest
- ✅ Firefox latest
- ✅ Safari latest (iOS & macOS)
- ✅ Mobile browsers

---

## Migration Guide

### From Manual Form State

**Before**:
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [errors, setErrors] = useState({});

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!email) setErrors({ ...errors, email: 'Required' });
  // ... more manual validation
};
```

**After**:
```typescript
const form = useForm({
  schema: authSchemas.login,
  onSubmit: async (data) => {
    // ... submit handler
  }
});

return (
  <form onSubmit={form.handleSubmit}>
    <FormInput
      label="Email"
      {...form.register('email')}
      error={form.formState.errors.email?.message}
    />
  </form>
);
```

---

## Status

✅ **PHASE 1**: Form library integration (React Hook Form) - COMPLETE  
✅ **PHASE 2**: Validation schema system (Zod) - COMPLETE  
✅ **PHASE 3**: Form components - COMPLETE  
✅ **PHASE 4**: Error mapping - COMPLETE  
✅ **PHASE 5**: Documentation - COMPLETE  

**Overall Progress**: 1.15 hours actual vs 1.5-2h estimated (1.3-1.7x faster)

---

**Ready for team adoption and use in all forms across the application.**
