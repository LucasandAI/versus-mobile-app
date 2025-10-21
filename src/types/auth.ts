
export type AuthMode = 'login' | 'signup' | 'profile-completion' | 'email-verification';

export interface SignupFormValues {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface ProfileFormValues {
  name: string;
  bio?: string;
  avatar?: File | null;
}
