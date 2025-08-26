// src/components/companies/CompanyForm.tsx
// ✅ REFACTORIZADO: Siguiendo exactamente los patrones del ContactForm funcional

import React, { useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
  COMPANY_TYPE_LABELS,
  COMPANY_SIZE_LABELS,
  INDUSTRY_LABELS
} from '@/types/company.types';

// ============================================
// UI COMPONENTS - Importados desde ubicación central
// ============================================
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FormField } from '@/components/forms/FormField';
import { SmartPhoneInput, type PhoneValidationResult, getRegionFromE164 } from '@/components/forms/PhoneInput';
import { GeographySelector } from '@/components/shared/GeographySelector';

// ============================================
// UTILITIES
// ============================================
import { getCountryName } from '@/utils/geography';

// ============================================
// VALIDATION SCHEMAS - SIGUIENDO PATRON CONTACTFORM
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
  
  // ✅ SIMPLIFICADO: string opcional que se convierte a null si está vacío
  type: z.string().optional(),
  
  email: z.string().email('Formato de email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Formato de URL inválido').optional().or(z.literal('')),
  
  address: addressSchema.optional(),
  
  // ✅ SIMPLIFICADO: string opcional
  industry: z.string().optional(),
  
  // ✅ SIMPLIFICADO: string opcional
  companySize: z.string().optional(),
  
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
// CONSTANTS - SIGUIENDO PATRON CONTACTFORM
// ============================================

const COMPANY_TYPE_OPTIONS = [
  { value: 'COMPANY', label: 'Empresa' },
  { value: 'FAMILY', label: 'Familia' },
  { value: 'INSTITUTION', label: 'Institución' },
  { value: 'OTHER', label: 'Otro' },
];

const COMPANY_SIZE_OPTIONS = [
  { value: 'SMALL', label: 'Pequeña' },
  { value: 'MEDIUM', label: 'Mediana' },
  { value: 'LARGE', label: 'Grande' },
  { value: 'ENTERPRISE', label: 'Corporativa' },
];

const INDUSTRY_OPTIONS = [
  // Tecnología
  { value: 'TECHNOLOGY', label: 'Tecnología' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'IT_SERVICES', label: 'Servicios TI' },
  
  // Servicios
  { value: 'CONSULTING', label: 'Consultoría' },
  { value: 'PROFESSIONAL_SERVICES', label: 'Servicios Profesionales' },
  { value: 'FINANCIAL_SERVICES', label: 'Servicios Financieros' },
  { value: 'LEGAL_SERVICES', label: 'Servicios Legales' },
  
  // Comercio
  { value: 'RETAIL', label: 'Retail' },
  { value: 'E_COMMERCE', label: 'E-commerce' },
  { value: 'WHOLESALE', label: 'Mayorista' },
  
  // Manufactura
  { value: 'MANUFACTURING', label: 'Manufactura' },
  { value: 'CONSTRUCTION', label: 'Construcción' },
  { value: 'AUTOMOTIVE', label: 'Automotriz' },
  
  // Salud y educación
  { value: 'HEALTHCARE', label: 'Salud' },
  { value: 'EDUCATION', label: 'Educación' },
  { value: 'NON_PROFIT', label: 'Sin Fines de Lucro' },
  
  // Otros
  { value: 'REAL_ESTATE', label: 'Bienes Raíces' },
  { value: 'TRANSPORTATION', label: 'Transporte' },
  { value: 'HOSPITALITY', label: 'Hospitalidad' },
  { value: 'MEDIA', label: 'Medios' },
  { value: 'OTHER', label: 'Otro' },
];

// ============================================
// MAIN COMPONENT - SIGUIENDO ESTRUCTURA CONTACTFORM
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
    register, control, handleSubmit,
    formState: { errors },
    watch, setValue, setError, clearErrors
    } = useForm<CompanyFormData>({
      resolver: zodResolver(companyFormSchema),
      defaultValues: useMemo(() => {
        if (!company) {
          // Modo creación - valores por defecto mínimos
          return { 
            name: '',
            type: '',
            email: '',
            phone: '',
            website: '',
            address: {
              addressLine1: '',
              addressLine2: '',
              city: '',
              state: '',
              postalCode: '',
              country: '',
            },
            industry: '',
            companySize: '',
            customFields: {}
          };
        }
        // Modo edición - cargar datos existentes
        return {
          name: company.name || '',
          type: company.type || '',
          email: company.email || '',
          phone: '', // SmartPhoneInput maneja esto
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
          companySize: company.companySize || '',
          annualRevenue: company.annualRevenue,
          customFields: company.customFields || {},
        };
    }, [company]),
  });

  const currentPhone = watch('phone');

  // ============================================
  // ✅ VALIDACIÓN CRUZADA EMAIL/PHONE - IGUAL QUE CONTACTFORM
  // ============================================
  const handleFormSubmit = async (data: CompanyFormData) => {
    if (data.phone && !phoneValidation.isValid) {
      setError('phone', { message: 'El teléfono debe ser válido antes de guardar' });
      return;
    }
    
    // ✅ VALIDACIÓN CRUZADA EXACTA COMO CONTACTFORM
    if (!data.email?.trim() && !phoneValidation.e164Phone) {
      setError('email', { message: 'Debe proporcionar al menos email o teléfono' });
      setError('phone', { message: 'Debe proporcionar al menos email o teléfono' });
      return;
    }

    // ✅ PAYLOAD MAPPING - CONVERSIÓN CORRECTA DE STRINGS VACÍAS
    const payload: any = {
      name: data.name.trim(),
      ...(data.type && data.type.trim() && { type: data.type as CompanyType }),
      email: data.email?.trim() || null,
      phone: phoneValidation.e164Phone || null,
      phoneRegion: phoneRegion || null,
      website: data.website?.trim() || null,
      address: data.address,
      ...(data.industry && data.industry.trim() && { industry: data.industry as Industry }),
      ...(data.companySize && data.companySize.trim() && { size: data.companySize as CompanySize }),
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
  // PHONE VALIDATION - IGUAL QUE CONTACTFORM
  // ============================================
  const handlePhoneValidation = useCallback((result: PhoneValidationResult) => {
    setPhoneValidation(result);
    
    if (result.isValid && result.e164Phone) {
      const region = getRegionFromE164(result.e164Phone);

      if (mode === 'create' && region !== phoneRegion) {
        setValue('address.state', '');
        setValue('address.city', '');
      }

      setPhoneRegion(region);
      setSelectedCountryFromPhone(region);
      setValue('address.country', getCountryName(region));
    }
    
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
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ingresa el nombre de la empresa"
            />
          </FormField>

          {/* ✅ TIPO OPCIONAL COMO GÉNERO */}
          <FormField
            label="Tipo de organización"
            name="type"
            icon={<Users className="h-4 w-4" />}
            error={errors.type?.message}
          >
            <select
              {...register('type')}
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Seleccionar...</option>
              {COMPANY_TYPE_OPTIONS.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
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
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="contacto@empresa.com"
            />
          </FormField>

          <FormField
            label="Teléfono"
            name="phone"
            icon={<Phone className="h-4 w-4" />}
            error={errors.phone?.message}
            description="Teléfono principal con formato E164 estándar"
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
          <input
            {...register('website')}
            type="url"
            className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="https://www.empresa.com"
          />
        </FormField>
      </div>

      {/* Business Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-app-gray-100 border-b border-app-dark-700 pb-2">
          Información Comercial
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ✅ INDUSTRY OPCIONAL COMO GÉNERO */}
          <FormField
            label="Industria"
            name="industry"
            icon={<Building2 className="h-4 w-4" />}
            error={errors.industry?.message}
          >
            <select
              {...register('industry')}
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Seleccionar...</option>
              {INDUSTRY_OPTIONS.map(industry => (
                <option key={industry.value} value={industry.value}>
                  {industry.label}
                </option>
              ))}
            </select>
          </FormField>

          {/* ✅ COMPANYSIZE OPCIONAL COMO GÉNERO */}
          <FormField
            label="Tamaño de la empresa"
            name="companySize"
            icon={<Users className="h-4 w-4" />}
            error={errors.companySize?.message}
          >
            <select
              {...register('companySize')}
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Seleccionar...</option>
              {COMPANY_SIZE_OPTIONS.map(size => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
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
                  <input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="1000000"
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </FormField>

            {/* Address - SIGUIENDO LAYOUT CONTACTFORM */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-app-gray-200 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Dirección
              </h4>
              
              {selectedCountryFromPhone && (
                <>
                  <h5 className="text-sm font-medium text-app-gray-300 pt-2">
                    Ubicación Geográfica
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    
                    <div className="col-span-1">
                      <FormField 
                        label="País" 
                        name="address.country" 
                        error={errors.address?.country?.message}
                      >
                        <input 
                          {...register('address.country')} 
                          type="text" 
                          readOnly 
                          className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-600 rounded text-app-gray-400 cursor-not-allowed" 
                          placeholder="Automático desde teléfono"
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
                        <input 
                          {...register('address.postalCode')} 
                          type="text" 
                          className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                          placeholder="760001"
                        />
                      </FormField>
                    </div>

                    <div className="col-span-1">
                      <FormField 
                        label="Dirección principal" 
                        name="address.addressLine1" 
                        error={errors.address?.addressLine1?.message}
                      >
                        <input 
                          {...register('address.addressLine1')} 
                          type="text" 
                          className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                          placeholder="Calle 123 #45-67"
                        />
                      </FormField>
                    </div>

                    <div className="col-span-1">
                      <FormField 
                        label="Dirección secundaria" 
                        name="address.addressLine2" 
                        error={errors.address?.addressLine2?.message}
                      >
                        <input 
                          {...register('address.addressLine2')} 
                          type="text" 
                          className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                          placeholder="Oficina, piso, etc."
                        />
                      </FormField>
                    </div>
                  </div>
                </>
              )}
            </div>
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