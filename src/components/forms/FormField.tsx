// src/components/forms/FormField.tsx
// Componente estructural para envolver un campo de formulario.

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  description?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  helpText,
  required,
  icon,
  children,
  description,
  className,
}) => (
  <div className={cn("space-y-1", className)}>
    <label htmlFor={name} className="flex items-center text-sm font-medium text-app-gray-300">
      {icon && <span className="mr-2 text-app-gray-400">{icon}</span>}
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    
    {children}
    
    {description && !error && (
      <p className="text-xs text-app-gray-500 pt-1">{description}</p>
    )}
    
    {/* V--- INICIO DEL CAMBIO QUIRÚRGICO ---V */}

    {/* Lógica mejorada: Muestra el error si existe. Si no, muestra el texto de ayuda. */}
    {error ? (
      <div className="flex items-center text-xs text-red-400 pt-1">
        <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
        {error}
      </div>
    ) : helpText ? (
      <p className="text-xs text-app-gray-500 pt-1">{helpText}</p>
    ) : null}
    
    {/* ^--- FIN DEL CAMBIO QUIRÚRGICO ---^ */}

  </div>
);