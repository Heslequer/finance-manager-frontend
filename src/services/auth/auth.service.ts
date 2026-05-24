import { supabase } from '../../lib/supabase';
import { usersApiService } from '../api/users/users.api';

const USER_SYNCED_STORAGE_KEY = 'finance_app_user_synced';

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

  async ensureUserInPublicTable(): Promise<void> {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user?.email) return;

    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(USER_SYNCED_STORAGE_KEY) === user.id) {
      return;
    }

    const name =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email.split('@')[0] ??
      'User';

    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(USER_SYNCED_STORAGE_KEY, user.id);
      }
      await usersApiService.createUser({ name, email: user.email });
    } catch (error) {
      if (error instanceof Error && error.message === 'User already exists') {
        return;
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(USER_SYNCED_STORAGE_KEY);
      }
      throw error;
    }
  }

  clearUserSyncCache(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(USER_SYNCED_STORAGE_KEY);
    }
  }

  async signInWithGoogle(redirectTo = `${window.location.origin}/reports`): Promise<void> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) throw error;
    if (data?.url) window.location.href = data.url;
  }

  async signInWithGithub(redirectTo = `${window.location.origin}/reports`): Promise<void> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
      },
    });

    if (error) throw error;
    if (data?.url) window.location.href = data.url;
  }

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
