import './Modal.scss';
import type { MouseEvent } from 'react';
import ModalCloseButton from '@/components/buttons/ModalCloseButton';
import type { ModalProps } from '@/lib/types/ui';

export default function Modal({
  open,
  title,
  width = 'min(760px, 100%)',
  disabled = false,
  scroll = 'auto',
  onClose,
  children,
}: ModalProps) {
  if (!open) return null;
  
  function onMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (disabled) return;
    if (e.target === e.currentTarget) onClose();
  }

  const scrollClass =
    scroll === 'none' ? 'modal-card--no-scroll' : 'modal-card--scroll';
  
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={onMouseDown}>
      <div className={['modal-card', scrollClass].join(' ')} style={{width}}>
        <div className="modal-header">
          <div style={{fontWeight: 900, fontSize: 16}}>{title}</div>
          <ModalCloseButton onClick={onClose} disabled={disabled}/>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
