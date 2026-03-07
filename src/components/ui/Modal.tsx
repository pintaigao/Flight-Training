import './Modal.scss';
import type { ReactNode } from 'react';

export default function Modal({
  open,
  title,
  width = 'min(760px, 100%)',
  disabled = false,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  width?: string;
  disabled?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // close on backdrop click
        if (disabled) return;
        if (e.target === e.currentTarget) onClose();
      }}>
      <div className="modal-card" style={{ width }}>
        <div className="modal-header">
          <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
          <button
            className="btn inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-sm font-semibold hover:bg-[color:var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onClose}
            disabled={disabled}>
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
