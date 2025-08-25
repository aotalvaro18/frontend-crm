// src/components/companies/CompanyForm.tsx
// ✅ VERSIÓN PERFECCIONADA: Micro-optimizaciones aplicadas
// Simplificación de lógica de teléfono, Select más limpio, y validaciones optimizadas

import React, { useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { 
  Building2, Mail, Phone, MapPin, Globe, DollarSign,
  Save, X, AlertCircle, Users
} from 'lucide-react';

// ============================================
// TYPES - Importados desde la fuente de verdad
// ============================================
import type {
  CompanyDTO,
  CompanyType,
  CompanySize,
  Industry,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from '@/types/company.types';

// ============================================
// UI COMPONENTS - Importados desde ubicación central
// ============================================
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FormField } from '@/components/forms/FormField';
import { SmartPhoneInput } from '@/components/forms/PhoneInput';
import { GeographySelector } from '@/components/shared/GeographySelector';

// ============================================
// UTILITIES
// ============================================
import { getCountryName } from '@/utils/geography';
import { 
  COMPANY_TYPE_LABELS as TYPE_LABELS, 
  COMPANY_SIZE_LABELS as SIZE_LABELS,
  INDUSTRY_LABELS 
} from '@/types/company.types';

// ============================================
// PHONE UTILITIES - Optimizados con libphonenumber-js
// ============================================

/**
 * Extrae la región/país de un número E164 usando libphonenumber-js
 * ✅ MEJORADO: Función robusta para todos los países del mundo
 */
const getRegionFromE164 = (e164Phone?: string): string | null => {
  if (!e164Phone) return null;
  try {
    const phoneNumber = parsePhoneNumberFromString(e164Phone);
    return phoneNumber?.country || null; // 'CO', 'US', etc.
  } catch {
    return null;
  }
};

// ============================================
// VALIDATION SCHEMAS
// ============================================

const addressSchema = z.object({
  addressLine1: z.string().max(100).optional().or(z.literal('')),
  addressLine2: z.string().max(100).optional().or(z.literal('')),
  city: z.string().max(50).optional().or(z.literal('')),
  state: z.string().max(50).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(50).optional().or(z.literal('')),
});

const companyFormSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre no puede tener más de 255 caracteres'),
  
  type: z.enum(['COMPANY', 'FAMILY', 'INSTITUTION', 'OTHER'], {
    required_error: 'El tipo de empresa es requerido'
  }),
  
  email: z.string().email('Formato de email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Formato de URL inválido').optional().or(z.literal('')),
  
  address: addressSchema.optional(),
  
  industry: z.string().max(100).optional().or(z.literal('')),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional().or(z.literal('')),
  
  annualRevenue: z.number()
    .min(0, 'El revenue debe ser mayor o igual a 0')
    .max(999999999999999, 'El revenue es demasiado grande')
    .optional(),
  
  customFields: z.record(z.any()).optional(),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

// ============================================
// PROPS INTERFACE
// ============================================

interface CompanyFormProps {
  company?: CompanyDTO;
  onSubmit: (data: CreateCompanyRequest | UpdateCompanyRequest) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error?: string | null;
  mode: 'create' | 'edit';
  showActions?: boolean;
}

// ============================================
// INTERFACES PARA SMART PHONE INPUT
// ============================================

interface PhoneValidationResult {
  isValid: boolean;
  e164Phone?: string;
  formattedDisplay?: string;
  errorMessage?: string;
}

// ============================================
// CONSTANTS - Optimizados sin opciones placeholder manuales
// ============================================

const COMPANY_TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({
  value: value as CompanyType,
  label
}));

const COMPANY_SIZE_OPTIONS = Object.entries(SIZE_LABELS).map(([value, label]) => ({
  value: value as CompanySize,
  label
}));

const INDUSTRY_OPTIONS = Object.entries(INDUSTRY_LABELS).map(([value, label]) => ({
  value: value as Industry,
  label
}));

// ============================================
// MAIN COMPONENT PERFECCIONADO
// ============================================

const CompanyForm = React.forwardRef<HTMLFormElement, CompanyFormProps>(
  ({
    company,
    onSubmit,
    onCancel,
    loading,
    error,
    mode,
    showActions = true,
  }, ref) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<PhoneValidationResult>({ isValid: true });
  const [selectedCountryFromPhone, setSelectedCountryFromPhone] = useState<string>('');
  const [phoneRegion, setPhoneRegion] = useState<string>('');

  const {
    control, handleSubmit,
    formState: { errors },
    watch, setValue, setError, clearErrors
    } = useForm<CompanyFormData>({
      resolver: zodResolver(companyFormSchema),
      defaultValues: useMemo(() => {
        if (!company) {
            return { 
              type: 'COMPANY',
              size: 'SMALL',
              customFields: {}
            };
        }
        return {
            name: company.name || '',
            type: company.type || 'COMPANY',
            email: company.email || '',
            phone: '',
            website: company.website || '',
            address: {
              addressLine1: company.address?.addressLine1 || '',
              addressLine2: company.address?.addressLine2 || '',
              city: company.address?.city || '',
              state: company.address?.state || '',
              postalCode: company.address?.postalCode || '',
              country: company.address?.country || '',
            },
            industry: company.industry || '',
            companySize: company.companySize || 'SMALL',
            annualRevenue: company.annualRevenue,
            customFields: company.customFields || {},
        };
    }, [company]),
  });

  const currentPhone = watch('phone');

  // ============================================
  // ✅ MEJORADO: handleFormSubmit simplificado y optimizado
  // ============================================
  const handleFormSubmit = async (data: CompanyFormData) => {
    if (data.phone && !phoneValidation.isValid) {
      setError('phone', { message: 'El teléfono debe ser válido antes de guardar' });
      return;
    }

    // ✅ OPTIMIZADO: Conversión más limpia, aprovechando que zod ya maneja opcional
    const payload = {
      name: data.name.trim(),
      type: data.type,
      email: data.email?.trim() || undefined,
      phone: phoneValidation.e164Phone || undefined,
      phoneRegion: phoneRegion || undefined,
      website: data.website?.trim() || undefined,
      address: data.address,
      industry: data.industry?.trim() || undefined,
      size: data.size || undefined,
      annualRevenue: data.annualRevenue,
      customFields: data.customFields,
    };

    if (mode === 'edit' && company) {
      const updateData: UpdateCompanyRequest = {
        ...payload,
        version: company.version,
      };
      await onSubmit(updateData);
    } else {
      const createData: CreateCompanyRequest = payload;
      await onSubmit(createData);
    }
  };

  // ============================================
  // ✅ MEJORADO: handlePhoneValidation simplificado con libphonenumber-js
  // ============================================
  const handlePhoneValidation = useCallback((result: PhoneValidationResult) => {
    setPhoneValidation(result);
    
    if (result.isValid && result.e164Phone) {
      // ✅ OPTIMIZADO: Usar helper robusto en lugar de regex hardcodeado
      const regionCode = getRegionFromE164(result.e164Phone);
      
      if (regionCode) {
        // Limpiar campos de geografía si cambió el país en modo creación
        if (mode === 'create' && regionCode !== phoneRegion) {
          setValue('address.state', '');
          setValue('address.city', '');
        }

        setPhoneRegion(regionCode);
        setSelectedCountryFromPhone(regionCode);
        setValue('address.country', getCountryName(regionCode));
      }
    }
    
    // Manejo de errores de validación
    if (currentPhone && !result.isValid) {
      setError('phone', { message: result.errorMessage || 'Formato de teléfono inválido' });
    } else {
      clearErrors('phone');
    }
  }, [currentPhone, setError, clearErrors, setValue, mode, phoneRegion]);

  const handlePhoneChange = useCallback((phone: string) => {
    setValue('phone', phone, { shouldValidate: true, shouldDirty: true });
  }, [setValue]);

  return (
    <form ref={ref} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-app-gray-100 border-b border-app-dark-700 pb-2">
          Información Básica
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Nombre de la empresa"
            name="name"
            required={true}
            icon={<Building2 className="h-4 w-4" />}
            error={errors.name?.message}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Ingresa el nombre de la empresa"
                  error={errors.name?.message}
                />
              )}
            />
          </FormField>

          <FormField
            label="Tipo de organización"
            name="type"
            required={true}
            icon={<Users className="h-4 w-4" />}
            error={errors.type?.message}
          >
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={COMPANY_TYPE_OPTIONS}
                  placeholder="Seleccionar tipo..."
                  error={errors.type?.message}
                />
              )}
            />
          </FormField>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-app-gray-100 border-b border-app-dark-700 pb-2">
          Información de Contacto
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Correo electrónico"
            name="email"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            description="Email principal de la empresa"
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="contacto@empresa.com"
                  error={errors.email?.message}
                />
              )}
            />
          </FormField>

          <FormField
            label="Teléfono"
            name="phone"
            icon={<Phone className="h-4 w-4" />}
            error={errors.phone?.message}
            description="Teléfono principal con formato E164"
          >
            <SmartPhoneInput
              value={currentPhone || ''}
              onChange={handlePhoneChange}
              onValidationChange={handlePhoneValidation}
              disabled={loading}
              initialE164={company?.phone}
            />
          </FormField>
        </div>

        <FormField
          label="Sitio web"
          name="website"
          icon={<Globe className="h-4 w-4" />}
          error={errors.website?.message}
          description="URL del sitio web de la empresa"
        >
          <Controller
            name="website"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="url"
                placeholder="https://www.empresa.com"
                error={errors.website?.message}
              />
            )}
          />
        </FormField>
      </div>

      {/* Business Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-app-gray-100 border-b border-app-dark-700 pb-2">
          Información Comercial
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Industria"
            name="industry"
            icon={<Building2 className="h-4 w-4" />}
            error={errors.industry?.message}
          >
            <Controller
              name="industry"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={INDUSTRY_OPTIONS}
                  placeholder="Seleccionar industria..."
                  error={errors.industry?.message}
                />
              )}
            />
          </FormField>

          <FormField
            label="Tamaño de la empresa"
            name="size"
            icon={<Users className="h-4 w-4" />}
            error={errors.size?.message}
          >
            <Controller
              name="size"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={COMPANY_SIZE_OPTIONS}
                  placeholder="Seleccionar tamaño..."
                  error={errors.size?.message}
                />
              )}
            />
          </FormField>
        </div>
      </div>

      {/* Advanced Information */}
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-app-gray-300 hover:text-app-gray-100 transition-colors"
         >
          <span className="text-lg font-medium">Información Adicional</span>
          <span className="ml-2 text-sm text-app-gray-500">
            {showAdvanced ? '(ocultar)' : '(mostrar)'}
          </span>
        </button>

        {showAdvanced && (
          <div className="space-y-6 p-4 bg-app-dark-700/50 rounded-lg border border-app-dark-600">
            {/* Revenue */}
            <FormField
              label="Revenue anual (USD)"
              name="annualRevenue"
              icon={<DollarSign className="h-4 w-4" />}
              error={errors.annualRevenue?.message}
              description="Ingresos anuales aproximados en dólares"
            >
              <Controller
                name="annualRevenue"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1000000"
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    error={errors.annualRevenue?.message}
                  />
                )}
              />
            </FormField>

            {/* Address */}
            {selectedCountryFromPhone && (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-app-gray-200 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Dirección
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  
                  <div className="col-span-1">
                    <FormField 
                      label="País" 
                      name="address.country" 
                      error={errors.address?.country?.message}
                    >
                      <Controller
                        name="address.country"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            placeholder="Automático desde teléfono"
                            className="cursor-not-allowed opacity-75"
                          />
                        )}
                      />
                    </FormField>
                  </div>
                  
                  <div className="col-span-1">
                    <FormField 
                      label={selectedCountryFromPhone === 'CO' ? 'Departamento' : 'Estado/Provincia'} 
                      name="address.state" 
                      error={errors.address?.state?.message}
                    >
                      <GeographySelector
                        countryCode={selectedCountryFromPhone}
                        selectedState={watch('address.state') || ''}
                        onStateChange={(state) => setValue('address.state', state, { shouldValidate: true })}
                        onCityChange={() => {}}
                        disabled={loading || !selectedCountryFromPhone}
                        layout="separate"
                        renderStateOnly
                        errorState={errors.address?.state?.message}
                      />
                    </FormField>
                  </div>

                  <div className="col-span-1">
                    <FormField 
                      label="Ciudad" 
                      name="address.city" 
                      error={errors.address?.city?.message}
                    >
                      <GeographySelector
                        countryCode={selectedCountryFromPhone}
                        selectedState={watch('address.state') || ''}
                        selectedCity={watch('address.city') || ''}
                        onCityChange={(city) => setValue('address.city', city, { shouldValidate: true })}
                        onStateChange={() => {}}
                        onPostalCodeAutoFill={(postalCode) => {
                          setValue('address.postalCode', postalCode, { shouldValidate: true });
                        }}
                        disabled={loading || !watch('address.state')}
                        layout="separate"
                        renderCityOnly
                        errorCity={errors.address?.city?.message}
                        showPostalCodeHint={true}
                      />
                    </FormField>
                  </div>

                  <div className="col-span-1">
                    <FormField 
                      label="Código postal" 
                      name="address.postalCode" 
                      error={errors.address?.postalCode?.message}
                    >
                      <Controller
                        name="address.postalCode"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="760001"
                            error={errors.address?.postalCode?.message}
                          />
                        )}
                      />
                    </FormField>
                  </div>

                  <div className="col-span-1">
                    <FormField 
                      label="Dirección principal" 
                      name="address.addressLine1" 
                      error={errors.address?.addressLine1?.message}
                    >
                      <Controller
                        name="address.addressLine1"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="Calle 123 #45-67"
                            error={errors.address?.addressLine1?.message}
                          />
                        )}
                      />
                    </FormField>
                  </div>

                  <div className="col-span-1">
                    <FormField 
                      label="Dirección secundaria" 
                      name="address.addressLine2" 
                      error={errors.address?.addressLine2?.message}
                    >
                      <Controller
                        name="address.addressLine2"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder="Oficina, piso, etc."
                            error={errors.address?.addressLine2?.message}
                          />
                        )}
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-app-dark-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          
          <Button
            type="submit"
            disabled={loading || (!!currentPhone && !phoneValidation.isValid)}
            className="min-w-32"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === 'create' ? 'Crear Empresa' : 'Actualizar Empresa'}
          </Button>
        </div>
      )}

    </form>
  );
});

CompanyForm.displayName = 'CompanyForm';

export default CompanyForm;