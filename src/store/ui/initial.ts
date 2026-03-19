import type { UIState } from '@/lib/types/state';

export const initialUiState: UIState = {
  filters: { q: '', aircraft: 'ALL', tag: 'ALL' },
  mapMode: 'ALL',
};
