import './Modal.scss';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  disabled = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card" style={{ width: 'min(560px, 100%)' }}>
        <div className="modal-header">
          <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
          <button className="btn" onClick={onCancel} disabled={disabled}>
            {cancelText}
          </button>
        </div>
        <div className="modal-body">
          {message && <div className="muted">{message}</div>}
          <div style={{ height: 14 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn" onClick={onCancel} disabled={disabled}>
              {cancelText}
            </button>
            <button
              className={danger ? 'btn-danger' : 'btn-primary'}
              onClick={onConfirm}
              disabled={disabled}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
