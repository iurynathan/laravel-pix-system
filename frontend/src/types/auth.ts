export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  token_type: string;
  access_token: string;
  user: User;
}

export interface UserProfileResponse {
  user: User;
  pix_stats: {
    total: number;
    generated: number;
    paid: number;
    expired: number;
    total_amount: number;
  };
}
