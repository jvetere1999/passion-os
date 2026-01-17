/**
 * Validation Schema Definitions
 *
 * Reusable Zod schemas for common form patterns.
 * Build form validation by composing these schemas.
 */

import { z } from 'zod';

/**
 * Common field validators (reusable)
 */
export const validators = {
  // Email validation
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required'),

  // Password validation (8+ chars, at least 1 number and letter)
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  // Password (weak - just length)
  passwordWeak: z
    .string()
    .min(6, 'Password must be at least 6 characters'),

  // Required string
  requiredString: z
    .string()
    .min(1, 'This field is required'),

  // Optional string
  optionalString: z
    .string()
    .optional()
    .nullable(),

  // Required text (longer, for descriptions)
  requiredText: z
    .string()
    .min(1, 'This field is required')
    .max(5000, 'Text must be less than 5000 characters'),

  // Optional text
  optionalText: z
    .string()
    .max(5000, 'Text must be less than 5000 characters')
    .optional()
    .nullable(),

  // URL validation
  url: z
    .string()
    .url('Invalid URL')
    .optional()
    .nullable(),

  // Phone validation (basic)
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number')
    .optional()
    .nullable(),

  // Username (3-20 chars, alphanumeric + underscore)
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  // Number range
  numberInRange: (min: number, max: number) =>
    z
      .number()
      .min(min, `Must be at least ${min}`)
      .max(max, `Must be at most ${max}`),

  // Date validation
  date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),

  // Select validation (at least one value)
  select: z
    .string()
    .min(1, 'Please select an option'),

  // Checkbox (must be true)
  checked: z
    .boolean()
    .refine((val) => val === true, 'This field is required'),

  // Tags/array of strings
  tags: z
    .array(z.string())
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed'),

  // Optional tags
  optionalTags: z
    .array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .nullable(),
};

/**
 * Authentication schemas
 */
export const authSchemas = {
  login: z.object({
    email: validators.email,
    password: validators.requiredString,
    rememberMe: z.boolean().optional(),
  }),

  signup: z.object({
    email: validators.email,
    password: validators.password,
    confirmPassword: validators.requiredString,
    agreedToTerms: validators.checked,
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),

  resetPassword: z.object({
    email: validators.email,
  }),

  setNewPassword: z.object({
    password: validators.password,
    confirmPassword: validators.requiredString,
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
};

/**
 * Profile schemas
 */
export const profileSchemas = {
  updateProfile: z.object({
    name: validators.requiredString,
    email: validators.email,
    bio: validators.optionalText,
    avatar: validators.optionalString,
  }),

  updatePreferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    language: z.enum(['en', 'es', 'fr']).optional(),
    notifications: z.boolean().optional(),
  }),
};

/**
 * Content schemas
 */
export const contentSchemas = {
  createPost: z.object({
    title: validators.requiredString,
    content: validators.requiredText,
    tags: validators.optionalTags,
    published: z.boolean().optional(),
  }),

  updatePost: z.object({
    title: validators.requiredString,
    content: validators.requiredText,
    tags: validators.optionalTags,
    published: z.boolean().optional(),
  }),

  createComment: z.object({
    content: validators.requiredText,
    parentId: validators.optionalString,
  }),
};

/**
 * Search/filter schemas
 */
export const searchSchemas = {
  search: z.object({
    query: validators.optionalString,
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),

  dateRange: z.object({
    startDate: validators.date.optional(),
    endDate: validators.date.optional(),
  }).refine((data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),
};

/**
 * Helper to create custom schema by combining validators
 *
 * @example
 * const mySchema = createSchema({
 *   email: validators.email,
 *   age: validators.numberInRange(18, 120),
 *   terms: validators.checked,
 * });
 */
export function createSchema<T extends Record<string, z.ZodType>>(fields: T) {
  return z.object(fields);
}

/**
 * Type inference helper - get TypeScript type from Zod schema
 *
 * @example
 * const schema = authSchemas.login;
 * type LoginFormData = z.infer<typeof schema>;
 */
export type SchemaType<T extends z.ZodType> = z.infer<T>;
