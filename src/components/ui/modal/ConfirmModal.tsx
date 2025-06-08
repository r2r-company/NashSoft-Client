import { Modal } from "./index";
import Button from "../button/Button";
import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Підтвердження дії",
  description = "Ви впевнені, що хочете продовжити?",
  children,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6 overflow-visible z-[9999]">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {title}
        </h2>

        {children ? (
          <div>{children}</div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {description}
          </p>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={onClose}>
            Ні
          </Button>
          <Button
            variant="primary"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
          >
            Так
          </Button>
        </div>
      </div>
    </Modal>
  );
}
