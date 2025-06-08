// components/ui/modal/Modal.tsx
import ReactDOM from "react-dom";
import React from "react";
import clsx from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className = "" }: ModalProps) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className={clsx(
          "bg-white dark:bg-neutral-900 rounded-xl shadow-lg w-full max-w-lg p-6 relative z-50",
          className
        )}
      >
        {children}
      </div>

      <div className="absolute inset-0 z-40" onClick={onClose} />
    </div>,
    document.body
  );
}
