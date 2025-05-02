import React from 'react';

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <section className="modal-close"><button onClick={onClose}>✖</button></section>
        {children}
      </div>
    </div>
  );
}