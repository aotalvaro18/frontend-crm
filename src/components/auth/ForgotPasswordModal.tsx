// src/components/auth/ForgotPasswordModal.tsx
// Modal para recuperación de contraseña - Componente extraído
// ✅ ENTERPRISE: Separado para mejor organización y reutilización

import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

// Components
import { Button } from '@/components/ui/Button';
import { EmailInput } from '@/components/ui/Input';

// ============================================
// TYPES
// ============================================

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
}

// ============================================
// FORGOT PASSWORD MODAL COMPONENT
// ============================================

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');
    
    try {
      await onSubmit(email);
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      setError('Error al enviar el código de recuperación. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setIsSuccess(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="p-6">
          <h3 
            id="modal-title"
            className="text-lg font-semibold text-gray-900 mb-4"
          >
            Recuperar Contraseña
          </h3>
          
          {isSuccess ? (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Se ha enviado un enlace de recuperación a <strong>{email}</strong>.
                Revisa tu bandeja de entrada y sigue las instrucciones.
              </p>
              <Button onClick={handleClose} className="w-full">
                Cerrar
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label 
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <EmailInput
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  autoComplete="email"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ingresa tu email empresarial para recibir un enlace de recuperación.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={!email || isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;