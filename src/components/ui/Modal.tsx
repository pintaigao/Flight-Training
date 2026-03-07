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
          <button className="btn" onClick={onClose} disabled={disabled}>
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
