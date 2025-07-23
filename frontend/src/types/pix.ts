export interface PixPayment {
  id: number;
  user_id: number;
  token: string;
  amount: string;
  description?: string;
  status: 'generated' | 'paid' | 'expired';
  expires_at: string;
  paid_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreatePixData {
  amount: number;
  description?: string;
}

export interface PixStatistics {
  generated: number;
  paid: number;
  expired: number;
  total: number;
}