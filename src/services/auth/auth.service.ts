import { supabase } from '../../lib/supabase';
import { usersApiService } from '../api/users/users.api';

export type SignInPayload = {
  email: string;
  password: string;
};

export type SignUpPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type SignUpResult = {
  requiresEmailConfirmation: boolean;
};

export class AuthService {
  async signInWithEmail(payload: SignInPayload): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) throw error;
  }

  async signUpWithEmail(payload: SignUpPayload): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName,
        },
      },
    });

    if (error) throw error;

    await usersApiService.createUser({
      name: payload.fullName,
      email: payload.email,
    });

    return {
      requiresEmailConfirmation: !data.session,
    };
  }
}

export const authService = new AuthService();
