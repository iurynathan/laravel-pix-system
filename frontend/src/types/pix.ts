export interface PixPayment {
  id: number;
  user_id?: number;
  token: string;
  amount: number;
  description?: string;
  status: 'generated' | 'paid' | 'expired';
  expires_at: string;
  paid_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  qr_code_url?: string;
  qr_code_base64?: string;
  remaining_time?: number;
  is_expired?: boolean;
  is_paid?: boolean;
  can_be_paid?: boolean;
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
  total_amount: number;
}
