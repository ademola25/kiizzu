import { api } from '@/lib/api';

/**
 * Request a password-reset code. The backend always responds 200 (no account
 * enumeration); `dev_code` is only returned when the server runs with DEBUG on.
 */
export async function requestPasswordReset(email: string): Promise<string | undefined> {
  const { data } = await api.post<{ dev_code?: string }>('/auth/password/reset/', {
    email: email.trim(),
  });
  return data.dev_code;
}

/** Set a new password using the emailed reset code. */
export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await api.post('/auth/password/reset/confirm/', {
    email: email.trim(),
    code,
    new_password: newPassword,
  });
}
