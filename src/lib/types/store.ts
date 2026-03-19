import type { Dispatch } from 'react';
import type { Action } from './actions';
import type { AppState } from './state';

export type Store = {
  state: AppState;
  dispatch: Dispatch<Action>;
};
