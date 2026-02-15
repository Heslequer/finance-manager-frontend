import { apiRequest } from '../http/httpClient';

export type CreatePublicUserPayload = {
  name: string;
  email: string;
};

export class UsersApiService {
  async createUser(payload: CreatePublicUserPayload): Promise<void> {
    await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const usersApiService = new UsersApiService();
