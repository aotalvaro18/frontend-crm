// src/components/companies/QuickCompanyForm.tsx
// ✅ FORMULARIO MÍNIMO para crear empresa desde ContactForm
// Siguiendo exactamente los patrones de ContactForm pero solo campos esenciales

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Building2, Mail, Phone, AlertCircle } from 'lucide-react';

// ============================================
// TYPES - Importados desde la fuente de verdad
// ============================================
import type {
  CompanyDTO,
  CreateCompanyRequest,
} from '@/types/company.types';

// ============================================
// UI COMPONENTS - Reutilizando componentes existentes
// ============================================
import { FormField } from '@/components/forms/FormField';
import { SmartPhoneInput, type PhoneValidationResult } from '@/components/forms/PhoneInput';

// ============================================
// VALIDATION SCHEMA - SOLO CAMPOS ESENCIALES
// ============================================

const quickCompanyFormSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre no puede tener más de 255 caracteres'),
  
  email: z.string().email('Formato de email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
});

type QuickCompanyFormData = z.infer<typeof quickCompanyFormSchema>;

// ============================================
// PROPS INTERFACE
// ============================================

interface QuickCompanyFormProps {
  onSubmit: (data: CreateCompanyRequest) => Promise<void>;
  loading: boolean;
  error?: string | null;
  initialName?: string;
}

// ============================================
// COMPONENTE PRINCIPAL - Siguiendo patrón ContactForm
// ============================================

const QuickCompanyForm = React.forwardRef<HTMLFormElement, QuickCompanyFormProps>(
  ({ onSubmit, loading, error, initialName }, ref) => {
    const [phoneValidation, setPhoneValidation] = useState<PhoneValidationResult>({ isValid: true });

    const {
      register, handleSubmit,
      formState: { errors },
      watch, setValue, setError, clearErrors
    } = useForm<QuickCompanyFormData>({
      resolver: zodResolver(quickCompanyFormSchema),
      defaultValues: {
        name: initialName || '',
        email: '',
        phone: '',
      },
    });

    const currentPhone = watch('phone');

    // ============================================
    // ✅ VALIDACIÓN CRUZADA EMAIL/PHONE - IGUAL QUE CONTACTFORM
    // ============================================
    const handleFormSubmit = async (data: QuickCompanyFormData) => {
      if (data.phone && !phoneValidation.isValid) {
        setError('phone', { message: 'El teléfono debe ser válido antes de guardar' });
        return;
      }
      
      // ✅ VALIDACIÓN CRUZADA: Al menos email O teléfono
      if (!data.email?.trim() && !phoneValidation.e164Phone) {
        setError('email', { message: 'Debe proporcionar al menos email o teléfono' });
        setError('phone', { message: 'Debe proporcionar al menos email o teléfono' });
        return;
      }

      // ✅ PAYLOAD CON VALORES POR DEFECTO INTELIGENTES
      const payload: CreateCompanyRequest = {
        name: data.name.trim(),
        type: 'COMPANY', // Valor por defecto para quick create
        email: data.email?.trim() || undefined,
        phone: phoneValidation.e164Phone || undefined,
        // Campos opcionales omitidos intencionalmente para quick create
      };

      await onSubmit(payload);
    };

    // ============================================
    // PHONE VALIDATION - IGUAL QUE CONTACTFORM (simplificado)
    // ============================================
    const handlePhoneValidation = useCallback((result: PhoneValidationResult) => {
      setPhoneValidation(result);
      
      if (currentPhone && !result.isValid) {
        setError('phone', { message: result.errorMessage || 'Formato de teléfono inválido' });
      } else {
        clearErrors('phone');
      }
    }, [currentPhone, setError, clearErrors]);

    const handlePhoneChange = useCallback((phone: string) => {
      setValue('phone', phone, { shouldValidate: true, shouldDirty: true });
    }, [setValue]);

    return (
      <form ref={ref} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Información Básica - Solo campos esenciales */}
        <div className="space-y-4">
          <FormField
            label="Nombre de la empresa"
            name="name"
            required={true}
            icon={<Building2 className="h-4 w-4" />}
            error={errors.name?.message}
            description="Este será el nombre que aparezca en el contacto"
          >
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ej: Acme Corporation"
              disabled={loading}
            />
          </FormField>

          <FormField
            label="Email de contacto"
            name="email"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            description="Email principal de la empresa (opcional si provides teléfono)"
          >
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="contacto@empresa.com"
              disabled={loading}
            />
          </FormField>

          <FormField
            label="Teléfono"
            name="phone"
            icon={<Phone className="h-4 w-4" />}
            error={errors.phone?.message}
            description="Teléfono principal (opcional si provees email)"
          >
            <SmartPhoneInput
              value={currentPhone || ''}
              onChange={handlePhoneChange}
              onValidationChange={handlePhoneValidation}
              disabled={loading}
            />
          </FormField>
        </div>

        {/* Info adicional */}
        <div className="p-3 bg-app-dark-700/30 rounded-lg border border-app-dark-600">
          <p className="text-xs text-app-gray-400">
            💡 <strong>Tip:</strong> Podrás añadir más información (dirección, industria, etc.) 
            editando la empresa después de crearla.
          </p>
        </div>
      </form>
    );
  }
);

QuickCompanyForm.displayName = 'QuickCompanyForm';

export default QuickCompanyForm;