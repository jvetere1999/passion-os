/**
 * Error Mapping Utilities
 *
 * Convert server validation errors to React Hook Form field errors.
 * Handle both field-level and general form errors.
 */

import { UseFormSetError } from 'react-hook-form';
import { ApiErrorResponse, FieldError, MappedErrors } from './types';

/**
 * Map server validation errors to form field errors
 *
 * @param error - Server error response or Error object
 * @returns Mapped field errors and general error message
 *
 * @example
 * try {
 *   await submitForm(data);
 * } catch (error) {
 *   const { fieldErrors, generalError } = mapServerErrors(error);
 *   // Apply field errors to form
 * }
 */
export function mapServerErrors(
  error: Error | ApiErrorResponse | unknown
): MappedErrors {
  const fieldErrors: Record<string, string> = {};
  let generalError: string | undefined;

  // Handle ApiErrorResponse
  if (isApiErrorResponse(error)) {
    if (error.errors && Array.isArray(error.errors)) {
      // Map field errors
      error.errors.forEach((fieldError: FieldError) => {
        fieldErrors[fieldError.field] = fieldError.message;
      });
    }
    // General error message
    generalError = error.message || 'An error occurred';
  }
  // Handle generic Error
  else if (error instanceof Error) {
    generalError = error.message || 'An error occurred';
  }
  // Handle unknown error
  else {
    generalError = 'An unexpected error occurred';
  }

  return { fieldErrors, generalError };
}

/**
 * Apply mapped errors to React Hook Form
 *
 * @param errors - Mapped field errors
 * @param setError - React Hook Form setError function
 *
 * @example
 * const { setError } = useForm();
 * const { fieldErrors } = mapServerErrors(error);
 * applyFormErrors(fieldErrors, setError);
 */
export function applyFormErrors<T extends Record<string, any>>(
  errors: Record<string, string>,
  setError: UseFormSetError<T>
): void {
  Object.entries(errors).forEach(([field, message]) => {
    (setError as any)(field, {
      type: 'server',
      message: String(message),
    });
  });
}

/**
 * Clear all form errors
 *
 * @param clearErrors - React Hook Form clearErrors function
 *
 * @example
 * const { clearErrors } = useForm();
 * clearFormErrors(clearErrors);
 */
export function clearFormErrors(clearErrors: (name?: string) => void): void {
  clearErrors();
}

/**
 * Type guard: check if error is ApiErrorResponse
 */
function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

/**
 * Extract field error message
 *
 * @param errors - Form errors object from React Hook Form
 * @param field - Field name
 * @returns Error message or undefined
 *
 * @example
 * const message = getFieldError(errors, 'email');
 * if (message) <span className="error">{message}</span>;
 */
export function getFieldError(
  errors: Record<string, any>,
  field: string
): string | undefined {
  const error = errors[field];
  if (!error) return undefined;

  // Handle React Hook Form FieldError structure
  if (typeof error === 'object' && 'message' in error) {
    return error.message as string;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return undefined;
}

/**
 * Check if field has error
 *
 * @example
 * if (hasFieldError(errors, 'email')) {
 *   <input className="error" />
 * }
 */
export function hasFieldError(
  errors: Record<string, any>,
  field: string
): boolean {
  return !!errors[field];
}

/**
 * Get all field errors as flat array
 *
 * @example
 * const allErrors = getAllFieldErrors(errors);
 * console.log(allErrors); // ['Email is invalid', 'Password too short']
 */
export function getAllFieldErrors(errors: Record<string, any>): string[] {
  return Object.values(errors)
    .map((error) => {
      if (typeof error === 'object' && 'message' in error) {
        return error.message as string;
      }
      if (typeof error === 'string') {
        return error;
      }
      return null;
    })
    .filter((error): error is string => error !== null);
}

/**
 * Check if form has any errors
 *
 * @example
 * if (hasFormErrors(errors)) {
 *   showErrorMessage('Please fix the errors below');
 * }
 */
export function hasFormErrors(errors: Record<string, any>): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Convert fetch error response to ApiErrorResponse
 *
 * @example
 * try {
 *   const response = await fetch('/api/form', { method: 'POST', body });
 *   if (!response.ok) {
 *     const error = await convertFetchError(response);
 *     throw error;
 *   }
 * } catch (error) {
 *   const mapped = mapServerErrors(error);
 * }
 */
export async function convertFetchError(
  response: Response
): Promise<ApiErrorResponse> {
  let body: any = {};

  try {
    body = await response.json();
  } catch {
    // If not JSON, body remains empty
  }

  return {
    message: body.message || response.statusText || 'Request failed',
    code: body.code || `HTTP_${response.status}`,
    details: body.details,
    errors: body.errors,
  };
}

/**
 * Validation error response converter
 *
 * @example
 * // Backend returns:
 * // { errors: [{ field: 'email', message: 'Invalid email', code: 'INVALID_EMAIL' }] }
 * const mapped = mapServerErrors(await response.json());
 */
export interface ServerValidationError {
  errors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

/**
 * Log validation error for debugging
 *
 * @example
 * logValidationError(errors, 'loginForm');
 */
export function logValidationError(
  errors: Record<string, any>,
  formName?: string
): void {
  const fieldErrors = getAllFieldErrors(errors);
  console.warn(
    `Form validation error${formName ? ` in ${formName}` : ''}:`,
    fieldErrors
  );
}
