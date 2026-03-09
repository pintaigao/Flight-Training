import { X } from 'lucide-react';

export default function ModalCloseButton({onClick, disabled = false, label = 'Close'}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--panel2)] text-[color:var(--muted)] hover:bg-[color:var(--panel)] hover:text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}>
      <X size={18} strokeWidth={2.5} aria-hidden="true"/>
    </button>
  );
}
