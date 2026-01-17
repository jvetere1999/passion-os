/**
 * Reusable Form Components
 *
 * Accessible, styled form components for use with React Hook Form.
 * All components integrate with design tokens and support validation states.
 */

'use client';

import React, { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './FormComponents.module.css';

/**
 * FormField - Container for label + input + error
 */
export const FormField = forwardRef<
  HTMLDivElement,
  {
    label?: string;
    error?: string;
    required?: boolean;
    helpText?: string;
    children: React.ReactNode;
  }
>(({ label, error, required, helpText, children }, ref) => (
  <div ref={ref} className={styles.formField}>
    {label && (
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
    )}
    {children}
    {error && <span className={styles.error}>{error}</span>}
    {helpText && !error && <span className={styles.helpText}>{helpText}</span>}
  </div>
));
FormField.displayName = 'FormField';

/**
 * FormInput - Text, email, password, number input
 */
export const FormInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
    required?: boolean;
    helpText?: string;
  }
>(({ label, error, required, helpText, className, ...props }, ref) => (
  <FormField label={label} error={error} required={required} helpText={helpText}>
    <input
      ref={ref}
      className={`${styles.input} ${error ? styles.inputError : ''} ${className || ''}`}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.name}-error` : undefined}
      {...props}
    />
  </FormField>
));
FormInput.displayName = 'FormInput';

/**
 * FormTextarea - Multi-line text input
 */
export const FormTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
    required?: boolean;
    helpText?: string;
  }
>(({ label, error, required, helpText, className, ...props }, ref) => (
  <FormField label={label} error={error} required={required} helpText={helpText}>
    <textarea
      ref={ref}
      className={`${styles.textarea} ${error ? styles.inputError : ''} ${className || ''}`}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.name}-error` : undefined}
      {...props}
    />
  </FormField>
));
FormTextarea.displayName = 'FormTextarea';

/**
 * FormSelect - Dropdown select
 */
export const FormSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    error?: string;
    required?: boolean;
    helpText?: string;
    options?: Array<{ value: string; label: string }>;
  }
>(({ label, error, required, helpText, options, className, children, ...props }, ref) => (
  <FormField label={label} error={error} required={required} helpText={helpText}>
    <select
      ref={ref}
      className={`${styles.select} ${error ? styles.inputError : ''} ${className || ''}`}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.name}-error` : undefined}
      {...props}
    >
      <option value="">Select an option</option>
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
      {children}
    </select>
  </FormField>
));
FormSelect.displayName = 'FormSelect';

/**
 * FormCheckbox - Checkbox input
 */
export const FormCheckbox = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  }
>(({ label, error, className, ...props }, ref) => (
  <div className={styles.formField}>
    <label className={styles.checkboxLabel}>
      <input
        ref={ref}
        type="checkbox"
        className={`${styles.checkbox} ${error ? styles.inputError : ''} ${className || ''}`}
        aria-invalid={!!error}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
    {error && <span className={styles.error}>{error}</span>}
  </div>
));
FormCheckbox.displayName = 'FormCheckbox';

/**
 * FormRadio - Radio button group
 */
export const FormRadio = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  }
>(({ label, error, className, ...props }, ref) => (
  <div className={styles.formField}>
    <label className={styles.radioLabel}>
      <input
        ref={ref}
        type="radio"
        className={`${styles.radio} ${error ? styles.inputError : ''} ${className || ''}`}
        aria-invalid={!!error}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
    {error && <span className={styles.error}>{error}</span>}
  </div>
));
FormRadio.displayName = 'FormRadio';

/**
 * FormError - Standalone error message
 */
export function FormError({ message, fieldName }: { message?: string; fieldName?: string }) {
  if (!message) return null;
  return (
    <div
      className={styles.errorMessage}
      role="alert"
      id={fieldName ? `${fieldName}-error` : undefined}
    >
      <span className={styles.errorIcon}>⚠</span>
      {message}
    </div>
  );
}

/**
 * FormSuccess - Success message
 */
export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className={styles.successMessage} role="status">
      <span className={styles.successIcon}>✓</span>
      {message}
    </div>
  );
}

/**
 * FormSubmitButton - Submit button with loading state
 */
export const FormSubmitButton = forwardRef<
  HTMLButtonElement,
  InputHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    loadingText?: string;
  }
>(({ loading, loadingText, disabled, children, ...props }, ref) => (
  <button
    ref={ref}
    type="submit"
    disabled={loading || disabled}
    className={`${styles.submitButton} ${loading ? styles.loading : ''}`}
    {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
  >
    {loading ? loadingText || 'Loading...' : children}
  </button>
));
FormSubmitButton.displayName = 'FormSubmitButton';

/**
 * FormFieldGroup - Group of related fields
 */
export function FormFieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <fieldset className={`${styles.fieldGroup} ${className || ''}`}>{children}</fieldset>;
}

/**
 * FormSection - Section with title and description
 */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.section} ${className || ''}`}>
      {title && <h3 className={styles.sectionTitle}>{title}</h3>}
      {description && <p className={styles.sectionDescription}>{description}</p>}
      {children}
    </div>
  );
}
