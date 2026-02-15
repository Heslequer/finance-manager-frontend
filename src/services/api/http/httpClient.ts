import { environment } from '../../../environments';
import { supabase } from '../../../lib/supabase';

type ApiErrorResponse = {
  message?: string | string[];
};

type ApiRequestOptions = RequestInit & {
  skipAuth?: boolean;
};

const AUTH_FREE_PATHS = ['/auth/login', '/auth/signup'] as const;

function isAuthFreePath(path: string): boolean {
  return AUTH_FREE_PATHS.some((authFreePath) => path.startsWith(authFreePath));
}

async function buildAuthHeader(path: string, options: ApiRequestOptions): Promise<HeadersInit> {
  if (options.skipAuth || isAuthFreePath(path)) {
    return options.headers ?? {};
  }

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  return {
    ...options.headers,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const requestHeaders = await buildAuthHeader(path, options);

  const response = await fetch(`${environment.backendApiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...requestHeaders,
    },
  });

  if (!response.ok) {
    let errorMessage = 'Request failed.';

    try {
      const responseBody = (await response.json()) as ApiErrorResponse;
      if (Array.isArray(responseBody.message)) {
        errorMessage = responseBody.message.join(', ');
      } else if (responseBody.message) {
        errorMessage = responseBody.message;
      }
    } catch {
      errorMessage = `Request failed with status ${response.status}.`;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return (await response.json()) as TResponse;
  }

  return undefined as TResponse;
}
