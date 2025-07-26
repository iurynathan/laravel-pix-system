import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth';
import { api } from './api';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  UserProfileResponse,
} from '@/types/auth';

vi.mock('./api');

const mockedApi = vi.mocked(api, true);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => (store[key] = value.toString()),
    removeItem: (key: string) => delete store[key],
    clear: () => (store = {}),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Service: authService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should call api.post with credentials and return auth data', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password',
      };
      const authResponse: AuthResponse = {
        token_type: 'Bearer',
        access_token: 'test-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      };
      mockedApi.post.mockResolvedValue({ data: { data: authResponse } });

      const result = await authService.login(credentials);

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(authResponse);
    });
  });

  describe('register', () => {
    it('should call api.post with register data and return auth data', async () => {
      const registerData: RegisterData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      };
      const authResponse: AuthResponse = {
        token_type: 'Bearer',
        access_token: 'new-token',
        user: {
          id: 2,
          name: 'New User',
          email: 'new@example.com',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      };
      mockedApi.post.mockResolvedValue({ data: { data: authResponse } });

      const result = await authService.register(registerData);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/auth/register',
        registerData
      );
      expect(result).toEqual(authResponse);
    });
  });

  describe('logout', () => {
    it('should call api.post to logout and remove token from localStorage', async () => {
      localStorage.setItem('auth_token', 'some-token');
      mockedApi.post.mockResolvedValue({});

      await authService.logout();

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('me', () => {
    it('should call api.get to fetch user profile and return user data', async () => {
      const user: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };
      const profileResponse: UserProfileResponse = {
        user,
        pix_stats: {
          total: 0,
          generated: 0,
          paid: 0,
          expired: 0,
          total_amount: 0,
        },
      };
      mockedApi.get.mockResolvedValue({ data: { data: profileResponse } });

      const result = await authService.me();

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(user);
    });
  });

  describe('getProfile', () => {
    it('should call api.get to fetch user profile and return the full profile response', async () => {
      const user: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };
      const profileResponse: UserProfileResponse = {
        user,
        pix_stats: {
          total: 5,
          generated: 2,
          paid: 2,
          expired: 1,
          total_amount: 500,
        },
      };
      mockedApi.get.mockResolvedValue({ data: { data: profileResponse } });

      const result = await authService.getProfile();

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(profileResponse);
    });
  });
});
