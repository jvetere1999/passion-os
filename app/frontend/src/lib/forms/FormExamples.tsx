/**
 * Form Component Examples
 * Shows practical usage examples for the form system.
 */

import React from 'react';
import { useForm } from '@/lib/forms/useForm';
import {
  authSchemas,
  profileSchemas,
  contentSchemas,
  searchSchemas,
} from '@/lib/forms/schemas';
import {
  FormInput,
  FormTextarea,
  FormCheckbox,
  FormError,
  FormSubmitButton,
  FormSection,
} from '@/lib/forms/FormComponents';

/**
 * EXAMPLE 1: LOGIN FORM
 */
export function LoginFormExample() {
  const form = useForm({
    schema: authSchemas.login,
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    onSubmit: async (data) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      window.location.href = '/dashboard';
    },
  });

  return (
    <form onSubmit={form.handleSubmit as any}>
      <FormSection title="Sign In" description="Enter your credentials">
        {form.state.generalError && (
          <FormError message={form.state.generalError} />
        )}

        <FormInput
          label="Email"
          type="email"
          placeholder="your@email.com"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
          required
        />

        <FormInput
          label="Password"
          type="password"
          {...form.register('password')}
          error={form.formState.errors.password?.message}
          required
        />

        <FormCheckbox
          label="Remember me"
          {...form.register('rememberMe')}
        />

        <FormSubmitButton loading={form.state.isSubmitting}>
          Sign In
        </FormSubmitButton>
      </FormSection>
    </form>
  );
}

/**
 * EXAMPLE 2: SIGNUP FORM
 */
export function SignupFormExample() {
  const form = useForm({
    schema: authSchemas.signup,
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      agreedToTerms: false,
    },
    onSubmit: async (data) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      alert('Account created!');
    },
  });

  return (
    <form onSubmit={form.handleSubmit as any}>
      <FormSection title="Create Account">
        {form.state.generalError && (
          <FormError message={form.state.generalError} />
        )}

        <FormInput
          label="Email"
          type="email"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
          required
        />

        <FormInput
          label="Password"
          type="password"
          {...form.register('password')}
          error={form.formState.errors.password?.message}
          required
        />

        <FormInput
          label="Confirm Password"
          type="password"
          {...form.register('confirmPassword')}
          error={form.formState.errors.confirmPassword?.message}
          required
        />

        <FormCheckbox
          label="I agree to the terms"
          {...form.register('agreedToTerms')}
        />

        <FormSubmitButton loading={form.state.isSubmitting}>
          Create Account
        </FormSubmitButton>
      </FormSection>
    </form>
  );
}

/**
 * EXAMPLE 3: PROFILE UPDATE FORM
 */
export function ProfileUpdateFormExample() {
  const form = useForm({
    schema: profileSchemas.updateProfile,
    defaultValues: {
      name: 'John Doe',
      email: 'john@example.com',
      bio: '',
      avatar: '',
    },
    onSubmit: async (data) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      alert('Profile updated!');
    },
  });

  return (
    <form onSubmit={form.handleSubmit as any}>
      <FormSection title="Update Profile">
        {form.state.generalError && (
          <FormError message={form.state.generalError} />
        )}

        <FormInput
          label="Full Name"
          {...form.register('name')}
          error={form.formState.errors.name?.message}
          required
        />

        <FormInput
          label="Email"
          type="email"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
          required
        />

        <FormTextarea
          label="Bio"
          placeholder="Tell us about yourself..."
          rows={4}
          {...form.register('bio')}
          error={form.formState.errors.bio?.message}
        />

        <FormSubmitButton loading={form.state.isSubmitting}>
          Update Profile
        </FormSubmitButton>
      </FormSection>
    </form>
  );
}

/**
 * EXAMPLE 4: CREATE POST FORM
 */
export function CreatePostFormExample() {
  const form = useForm({
    schema: contentSchemas.createPost,
    defaultValues: {
      title: '',
      content: '',
      tags: [],
      published: false,
    },
    onSubmit: async (data) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    },
  });

  return (
    <form onSubmit={form.handleSubmit as any}>
      <FormSection title="Create Post">
        {form.state.generalError && (
          <FormError message={form.state.generalError} />
        )}

        <FormInput
          label="Title"
          placeholder="What's your post about?"
          {...form.register('title')}
          error={form.formState.errors.title?.message}
          required
        />

        <FormTextarea
          label="Content"
          placeholder="Write your post here..."
          rows={8}
          {...form.register('content')}
          error={form.formState.errors.content?.message}
          required
        />

        <FormCheckbox
          label="Publish immediately"
          {...form.register('published')}
        />

        <FormSubmitButton loading={form.state.isSubmitting}>
          Create Post
        </FormSubmitButton>
      </FormSection>
    </form>
  );
}

/**
 * EXAMPLE 5: SEARCH FORM
 */
export function SearchFormExample() {
  const form = useForm({
    schema: searchSchemas.search,
    defaultValues: {
      query: '',
      page: 1,
      limit: 10,
    },
    onSubmit: async (data) => {
      const params = new URLSearchParams({
        q: data.query,
        page: data.page.toString(),
        limit: data.limit.toString(),
      });

      const response = await fetch(`/api/search?${params}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      return response.json();
    },
  });

  return (
    <form onSubmit={form.handleSubmit as any}>
      <FormSection title="Search">
        <FormInput
          label="Search Query"
          placeholder="Enter search terms..."
          {...form.register('query')}
          error={form.formState.errors.query?.message}
        />

        <FormInput
          label="Results Per Page"
          type="number"
          {...form.register('limit', { valueAsNumber: true })}
          error={form.formState.errors.limit?.message}
        />

        <FormSubmitButton loading={form.state.isSubmitting}>
          Search
        </FormSubmitButton>
      </FormSection>
    </form>
  );
}
