# Disabling Email Verification for Development

To disable email verification in Supabase and allow immediate signup/login during development:

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/
2. Navigate to **Authentication → Providers → Email**
3. **Uncheck** "Confirm email" toggle
4. Save changes

This allows users to sign up with email/password and immediately have a valid session without needing to confirm their email. Email verification will be re-enabled when you're ready for production.

## Current Status

- Email verification is currently **enabled** in your Supabase project
- Users can sign up with email/password but cannot create threads or reply until they confirm their email
- Sign-up form now shows a notice that verification will be required in production
- This prevents the "email rate limit exceeded" error by not sending verification emails during development

## Why This Happens

Supabase has a rate limit on how many verification emails can be sent. Once you disable email confirmation in project settings, sign-ups will work immediately and no verification emails will be sent.
