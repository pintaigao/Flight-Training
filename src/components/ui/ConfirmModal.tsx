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
          <button
            className="btn inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-sm font-semibold hover:bg-[color:var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onCancel}
            disabled={disabled}>
            {cancelText}
          </button>
        </div>
        <div className="modal-body">
          {message && (
            <div className="muted text-sm text-[var(--muted)]">{message}</div>
          )}
          <div style={{ height: 14 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              className="btn inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 font-semibold hover:bg-[color:var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onCancel}
              disabled={disabled}>
              {cancelText}
            </button>
            <button
              className={[
                danger ? 'btn-danger' : 'btn-primary',
                danger
                  ? 'inline-flex h-11 items-center justify-center rounded-xl border border-[color:rgba(255,84,84,0.35)] bg-[color:rgba(255,84,84,0.14)] px-4 font-semibold text-[color:rgba(255,84,84,0.95)] hover:bg-[color:rgba(255,84,84,0.18)] disabled:cursor-not-allowed disabled:opacity-60'
                  : 'inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)] disabled:cursor-not-allowed disabled:opacity-60',
              ].join(' ')}
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
