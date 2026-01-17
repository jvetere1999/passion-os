/**
 * useForm Hook
 *
 * Custom hook that integrates React Hook Form with Zod validation,
 * error mapping, and loading states.
 */

'use client';

import { useCallback, useState } from 'react';
import { useForm as useRHF, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodType } from 'zod';
import { ApiErrorResponse, FormHandlers, FormState } from './types';
import { mapServerErrors, applyFormErrors, logValidationError } from './errorMapping';

/**
 * Form configuration combining RHF options and validation
 */
interface UseFormConfig<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema?: ZodType;
  onSubmit: (data: T) => Promise<void> | void;
  onSuccess?: (data: T) => void;
  onError?: (error: Error | ApiErrorResponse) => void;
}

/**
 * Enhanced useForm hook
 *
 * @example
 * const form = useForm({
 *   schema: authSchemas.login,
 *   defaultValues: { email: '', password: '' },
 *   onSubmit: async (data) => {
 *     const response = await fetch('/api/login', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *     if (!response.ok) throw await convertFetchError(response);
 *   },
 *   onSuccess: (data) => {
 *     router.push('/dashboard');
 *   },
 *   onError: (error) => {
 *     console.error('Form submission failed:', error);
 *   }
 * });
 *
 * return (
 *   <form onSubmit={form.handleSubmit}>
 *     <FormInput
 *       label="Email"
 *       {...form.register('email')}
 *       error={form.errors.email?.message}
 *     />
 *     <FormInput
 *       label="Password"
 *       type="password"
 *       {...form.register('password')}
 *       error={form.errors.password?.message}
 *     />
 *     {form.state.generalError && (
 *       <FormError message={form.state.generalError} />
 *     )}
 *     <FormSubmitButton loading={form.state.isSubmitting}>
 *       Login
 *     </FormSubmitButton>
 *   </form>
 * );
 */
export function useForm<T extends FieldValues = FieldValues>(
  config: UseFormConfig<T>
): UseFormReturn<T> & { state: FormState } {
  const { schema, onSubmit, onSuccess, onError, ...rhfConfig } = config;
  const [generalError, setGeneralError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  // Create resolver if schema provided
  const resolver = schema ? zodResolver(schema as any) : undefined;

  // Initialize React Hook Form
  const form = useRHF<T>({
    ...rhfConfig,
    resolver,
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Enhanced submit handler with error handling
  const enhancedSubmit = useCallback(
    async (data: T) => {
      setGeneralError(undefined);
      setIsLoading(true);

      try {
        // Call user's onSubmit handler
        await Promise.resolve(onSubmit(data));

        // Success
        onSuccess?.(data);
      } catch (error) {
        // Map server errors to form fields
        const { fieldErrors, generalError: mappedGeneralError } = mapServerErrors(error);

        // Apply field errors
        if (Object.keys(fieldErrors).length > 0) {
          applyFormErrors(fieldErrors, form.setError);
        }

        // Set general error
        if (mappedGeneralError) {
          setGeneralError(mappedGeneralError);
        }

        // Log validation error
        logValidationError(form.formState.errors, 'form');

        // Call error handler
        onError?.(error as Error | ApiErrorResponse);
      } finally {
        setIsLoading(false);
      }
    },
    [onSubmit, onSuccess, onError, form]
  );

  // Get form state
  const state: FormState = {
    isSubmitting: form.formState.isSubmitting || isLoading,
    isLoading,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    generalError,
  };

  // Return enhanced form with state
  const wrappedSubmit = form.handleSubmit(enhancedSubmit);
  
  return {
    ...form,
    handleSubmit: wrappedSubmit,
    state,
  } as unknown as UseFormReturn<T> & { state: FormState };
}

/**
 * Hook for form array operations (multiple forms on same page)
 *
 * @example
 * const forms = useMultipleForms({
 *   'profile-form': { schema: profileSchema },
 *   'password-form': { schema: passwordSchema },
 * });
 * // Use: forms['profile-form'].register, forms['password-form'].handleSubmit, etc.
 */
export function useMultipleForms<
  T extends Record<string, FieldValues> = Record<string, FieldValues>
>(
  configs: Record<keyof T, UseFormConfig<T[keyof T]>>
): Record<keyof T, ReturnType<typeof useForm>> {
  return Object.entries(configs).reduce(
    (acc, [key, config]) => ({
      ...acc,
      [key]: useForm(config),
    }),
    {} as Record<keyof T, ReturnType<typeof useForm>>
  );
}

/**
 * Hook for resetting form after submission
 *
 * @example
 * const form = useForm({ ... });
 * const handleSuccess = useFormReset(form);
 *
 * const enhancedConfig = {
 *   ...config,
 *   onSuccess: handleSuccess,
 * };
 */
export function useFormReset<T extends FieldValues>(
  form: UseFormReturn<T>,
  resetValues?: Partial<T>
) {
  return useCallback(
    (data: T) => {
      // Reset form after delay for smoother UX
      setTimeout(() => {
        form.reset((resetValues as any) || (data as any));
      }, 300);
    },
    [form, resetValues]
  );
}

/**
 * Hook for watch specific form fields
 *
 * Note: This functionality is already available via form.watch from React Hook Form
 * const email = form.watch('email');
 * const [firstName, lastName] = form.watch(['firstName', 'lastName']);
 */
// Export all types for external use
export type { FormState, UseFormConfig };
