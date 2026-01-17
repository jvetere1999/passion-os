/**
 * Form Types & Interfaces
 *
 * Core type definitions for form system with React Hook Form and Zod validation.
 */

import { FieldValues, UseFormProps, UseFormReturn } from 'react-hook-form';
import { ZodSchema, ZodType } from 'zod';

/**
 * Field validation error
 */
export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Form validation error response from server
 */
export interface ValidationErrorResponse {
  errors: FieldError[];
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  message: string;
  code: string;
  details?: Record<string, unknown>;
  errors?: FieldError[];
}

/**
 * Form field configuration
 */
export interface FormFieldConfig {
  name: string;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
}

/**
 * Form submission handlers
 */
export interface FormHandlers<T extends FieldValues = FieldValues> {
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (error: Error | ApiErrorResponse) => void;
  onSubmit: (data: T) => Promise<void> | void;
}

/**
 * Form state
 */
export interface FormState {
  isSubmitting: boolean;
  isLoading?: boolean;
  isDirty: boolean;
  isValid: boolean;
  generalError?: string;
}

/**
 * Form context for field components
 */
export interface FormContextValue<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  state: FormState;
  handlers: FormHandlers<T>;
  serverErrors: Record<string, string>;
}

/**
 * Zod validation schema type
 */
export type ValidationSchema = ZodSchema | ZodType<any>;

/**
 * Form configuration
 */
export interface FormConfig<T extends FieldValues = FieldValues> {
  schema?: ValidationSchema;
  defaultValues?: Partial<T>;
  fields?: FormFieldConfig[];
  onSubmit: (data: T) => Promise<void> | void;
  onSuccess?: (data: T) => void;
  onError?: (error: Error | ApiErrorResponse) => void;
}

/**
 * Server error mapping result
 */
export interface MappedErrors {
  fieldErrors: Record<string, string>;
  generalError?: string;
}
