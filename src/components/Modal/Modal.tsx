import './Modal.scss';
import type { ReactNode } from 'react';
import ModalCloseButton from '@/components/buttons/ModalCloseButton';

export default function Modal({open, title, width = 'min(760px, 100%)', disabled = false, onClose, children}: any) {
  if (!open) return null;
  
  function onMouseDown(e: any) {
    if (disabled) return;
    if (e.target === e.currentTarget) onClose();
  }
  
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={onMouseDown}>
      <div className="modal-card" style={{width}}>
        <div className="modal-header">
          <div style={{fontWeight: 900, fontSize: 16}}>{title}</div>
          <ModalCloseButton onClick={onClose} disabled={disabled}/>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
