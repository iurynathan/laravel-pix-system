export interface PixFilters {
  status?: 'generated' | 'paid' | 'expired' | '';
  search?: string;
  start_date?: string;
  end_date?: string;
  min_value?: string;
  max_value?: string;
  sort_by?: 'created_at' | 'amount' | 'status';
  sort_direction?: 'asc' | 'desc';
}
