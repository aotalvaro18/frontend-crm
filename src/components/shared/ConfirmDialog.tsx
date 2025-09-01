// src/components/shared/ConfirmDialog.tsx
// Diálogo modal reutilizable para confirmar acciones importantes o destructivas.

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean; // Para mostrar el estado de carga
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isConfirming = false,
  children,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
          <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <h3 className="text-lg font-semibold leading-6 text-app-gray-100" id="modal-title">
            {title}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-app-gray-400">
              {description}
            </p>
          </div>
          {children} {/* ✅ AÑADIDO: Renderizar el contenido extra */}
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={isConfirming}
          className="inline-flex w-full justify-center sm:ml-3 sm:w-auto"
        >
          {isConfirming ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {confirmLabel}
        </Button>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isConfirming}
          className="mt-3 inline-flex w-full justify-center sm:mt-0 sm:w-auto"
        >
          {cancelLabel}
        </Button>
      </div>
    </Modal>
  );
};
