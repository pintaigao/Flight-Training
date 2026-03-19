import type { CSSProperties, ReactNode } from 'react';

export type Filters = {
  q: string;
  aircraft: string | 'ALL';
  tag: string | 'ALL';
};

export type Theme = 'light' | 'dark';

export type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

export type ModalProps = {
  open: boolean;
  title: ReactNode;
  width?: CSSProperties['width'];
  disabled?: boolean;
  scroll?: 'auto' | 'none';
  onClose: () => void;
  children: ReactNode;
};
