// src/components/contacts/ContactForm.tsx
// ✅ VERSIÓN FINAL: Contact form enterprise - E164 estándar y limpio

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, Mail, Phone, MapPin, 
  Save, X, AlertCircle, Check, Globe, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { 
    ContactDTO,               // <-- Este es el alias correcto para 'Contact'
    CreateContactRequest, 
    UpdateContactRequest, 
    ContactSource,
    Gender,
    AddressDTO,               // <-- Este es el alias correcto para 'Address'
    CommunicationPreferences
  } from '@/types/contact.types';

// ============================================
// E164 PHONE UTILITIES
// ============================================

interface PhoneValidationResult {
  isValid: boolean;
  e164Phone?: string;
  formattedDisplay?: string;
  errorMessage?: string;
}

interface CountryCode {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  format: string; // Formato de display
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57', format: '### ### ####' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', dialCode: '+1', format: '(###) ###-####' },
  { code: 'ES', name: 'España', flag: '🇪🇸', dialCode: '+34', format: '### ### ###' },
  { code: 'MX', name: 'México', flag: '🇲🇽', dialCode: '+52', format: '### ### ####' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', format: '### ### ####' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', dialCode: '+55', format: '### ### ####' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56', format: '### ### ####' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', dialCode: '+51', format: '### ### ###' },
];

/**
 * Extrae la región/país de un número E164
 */
const getRegionFromE164 = (e164Phone?: string): string => {
  if (!e164Phone || !e164Phone.startsWith('+')) return 'CO'; // Default a Colombia
  
  // Ordenar por longitud de dialCode para manejar casos como +1 (US) y +1-XXX (Caribe)
  const sortedCountries = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);

  for (const country of sortedCountries) {
    if (e164Phone.startsWith(country.dialCode)) {
      return country.code;
    }
  }
  return 'CO'; // Default
};

/**
 * Formatea un número E164 para display amigable
 */
const formatPhoneForDisplay = (e164Phone: string): string => {
  if (!e164Phone || !e164Phone.startsWith('+')) return e164Phone;
  
  const region = getRegionFromE164(e164Phone);
  const country = COUNTRY_CODES.find(c => c.code === region);
  
  if (!country) return e164Phone;
  
  const localNumber = e164Phone.replace(country.dialCode, '');
  
  let formatted = localNumber;
  const format = country.format;
  
  let formatIndex = 0;
  formatted = format.replace(/#/g, () => {
    return localNumber[formatIndex++] || '';
  });
  
  return `${country.flag} ${country.dialCode} ${formatted.trim()}`;
};

/**
 * Valida teléfono con el backend y retorna E164
 */
const validatePhoneWithBackend = async (phone: string, region: string): Promise<PhoneValidationResult> => {
  // 🔥 No validar si el input local está vacío
  const trimmedPhone = phone.trim();
  if (!trimmedPhone) {
    return { isValid: true }; // Un campo de teléfono vacío es válido
  }
  if (trimmedPhone.length < 7) {
    return { isValid: false, errorMessage: 'Teléfono muy corto' };
  }

  try {
    // 🔥 Simulando llamada a API por ahora. Reemplazar con tu cliente API real.
    // const result = await apiClient.post('/validate-phone', { phone, region });
    // SIMULACIÓN:
    const country = COUNTRY_CODES.find(c => c.code === region);
    const e164Phone = `${country?.dialCode}${trimmedPhone}`;
    const result = { 
        isValid: true, 
        e164Phone, 
        errorMessage: undefined // Añadimos la propiedad opcional
      };
    // FIN SIMULACIÓN

    return {
      isValid: result.isValid,
      e164Phone: result.e164Phone,
      formattedDisplay: result.e164Phone ? formatPhoneForDisplay(result.e164Phone) : undefined,
      errorMessage: result.errorMessage
    };
  } catch (error) {
    console.error('Phone validation error:', error);
    return { 
      isValid: false, 
      errorMessage: 'Error al validar teléfono. Verificar formato.' 
    };
  }
};

// ============================================
// VALIDATION SCHEMAS (🔥 AJUSTADO)
// ============================================

const addressSchema = z.object({
  addressLine1: z.string().max(100).optional().or(z.literal('')),
  addressLine2: z.string().max(100).optional().or(z.literal('')),
  city: z.string().max(50).optional().or(z.literal('')),
  state: z.string().max(50).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(50).optional().or(z.literal('')),
});

// ✅ NUEVO ESQUEMA ESPECÍFICO
const communicationPreferencesSchema = z.object({
    allowEmail: z.boolean().optional(),
    allowSms: z.boolean().optional(),
    allowPhone: z.boolean().optional(),
    allowWhatsapp: z.boolean().optional(),
    marketingConsent: z.boolean().optional(),
    // Añade aquí cualquier otra propiedad de tu interfaz CommunicationPreferences
  }).optional();

// 🔥 phoneRegion ELIMINADO del esquema. Ahora es estado de UI.
const contactFormSchema = z.object({
  firstName: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres'),
  
  lastName: z.string()
    .min(1, 'El apellido es requerido')
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede tener más de 50 caracteres'),
  
  email: z.string()
    .email('Formato de email inválido')
    .optional()
    .or(z.literal('')),
  
  phone: z.string().optional(), // Este es el número LOCAL, no el E164
  
  companyId: z.number().optional(),
  
  address: addressSchema.optional(),
  
  birthDate: z.string().optional().or(z.literal('')),
  
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  
  source: z.string()
    .min(1, 'La fuente es requerida'),
  
  sourceDetails: z.string().optional(),
  
  customFields: z.record(z.any()).optional(),
  
  communicationPreferences: communicationPreferencesSchema,
  
  tags: z.array(z.number()).optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

// ============================================
// TYPES
// ============================================

interface ContactFormProps {
  contact?: ContactDTO;
  onSubmit: (data: CreateContactRequest | UpdateContactRequest) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error?: string | null;
  mode: 'create' | 'edit';
}

// ============================================
// FORM FIELD COMPONENT
// ============================================

interface FormFieldProps {
    label: string;
    name: string;
    error?: string;
    required?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
    description?: string;
  }
  
  const FormField: React.FC<FormFieldProps> = ({
    label,
    name,
    error,
    required,
    icon,
    children,
    description
  }) => (
    <div className="space-y-1">
      <label htmlFor={name} className="flex items-center text-sm font-medium text-app-gray-300">
        {icon && <span className="mr-2 text-app-gray-400">{icon}</span>}
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {description && (
        <p className="text-xs text-app-gray-500">{description}</p>
      )}
      {error && (
        <div className="flex items-center text-xs text-red-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </div>
      )}
    </div>
  );

interface SmartPhoneInputProps {
  value: string; // Valor local del input
  onChange: (phone: string) => void;
  onValidationChange: (result: PhoneValidationResult) => void;
  disabled?: boolean;
  initialE164?: string; // E164 inicial del contacto
}

const SmartPhoneInput: React.FC<SmartPhoneInputProps> = ({
  value,
  onChange,
  onValidationChange,
  disabled,
  initialE164
}) => {
  const [selectedRegion, setSelectedRegion] = useState(() => getRegionFromE164(initialE164));
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<PhoneValidationResult | null>(null);

  // Efecto para inicializar el valor del input si estamos en modo edición
  useEffect(() => {
    if (initialE164) {
      const region = getRegionFromE164(initialE164);
      setSelectedRegion(region);
      const country = COUNTRY_CODES.find(c => c.code === region);
      if (country) {
        const localNumber = initialE164.replace(country.dialCode, '');
        onChange(localNumber);
      }
    }
  }, [initialE164, onChange]);

  const validatePhone = useCallback(async (phone: string, region: string) => {
    setIsValidating(true);
    try {
      const result = await validatePhoneWithBackend(phone, region);
      setValidationResult(result);
      onValidationChange(result);
    } catch (error) {
      const errorResult = { isValid: false, errorMessage: 'Error de validación' };
      setValidationResult(errorResult);
      onValidationChange(errorResult);
    } finally {
      setIsValidating(false);
    }
  }, [onValidationChange]);

  // Debounce validation
  useEffect(() => {
    const timer = setTimeout(() => {
      validatePhone(value, selectedRegion);
    }, 800);

    return () => clearTimeout(timer);
  }, [value, selectedRegion, validatePhone]);

  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    // Re-validar inmediatamente con la nueva región
    validatePhone(value, newRegion);
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedRegion);

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <select
          value={selectedRegion}
          onChange={(e) => handleRegionChange(e.target.value)}
          disabled={disabled}
          className="px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {COUNTRY_CODES.map(country => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.name} ({country.dialCode})
            </option>
          ))}
        </select>
        
        <div className="relative flex-1">
          <input
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 pr-10 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={selectedCountry?.format.replace(/#/g, '0') || '3001234567'}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValidating ? (
              <LoadingSpinner size="xs" />
            ) : validationResult?.isValid && value ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : validationResult && !validationResult.isValid && value ? (
              <AlertCircle className="h-4 w-4 text-red-400" />
            ) : null}
          </div>
        </div>
      </div>
      
      {validationResult && !validationResult.isValid && value && (
        <div className="text-xs text-red-400 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {validationResult.errorMessage}
        </div>
      )}
      
      {validationResult?.isValid && validationResult.e164Phone && (
        <div className="text-xs text-green-400 flex items-center">
          <Check className="h-3 w-3 mr-1" />
          Validado como: {validationResult.formattedDisplay}
        </div>
      )}
    </div>
  );
};

// ============================================
// CONSTANTS (Sin cambios)
// ============================================

const CONTACT_SOURCES = [
    { value: 'WEBSITE', label: 'Sitio Web' },
    { value: 'MANUAL_ENTRY', label: 'Entrada Manual' },
    { value: 'IMPORT', label: 'Importación' },
    { value: 'REFERRAL', label: 'Referido' },
    { value: 'SOCIAL_MEDIA', label: 'Redes Sociales' },
    { value: 'EMAIL_CAMPAIGN', label: 'Campaña de Email' },
    { value: 'CHURCH_SERVICE', label: 'Servicio Religioso' },
    { value: 'CHURCH_EVENT', label: 'Evento de Iglesia' },
    { value: 'VOLUNTEER', label: 'Voluntariado' },
    { value: 'OTHER', label: 'Otro' },
  ];
  
  const GENDERS = [
    { value: 'MALE', label: 'Masculino' },
    { value: 'FEMALE', label: 'Femenino' },
    { value: 'OTHER', label: 'Otro' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefiero no decir' },
  ];
  
  // ============================================
  // COMMUNICATION PREFERENCES COMPONENT
  // ============================================
  
  interface CommunicationPreferencesProps {
    value: Record<string, boolean>;
    onChange: (value: Record<string, boolean>) => void;
  }
  
  const CommunicationPreferences: React.FC<CommunicationPreferencesProps> = ({
    value,
    onChange
  }) => {
    const preferences = [
      { key: 'allowEmail', label: 'Correo electrónico' },
      { key: 'allowSms', label: 'SMS' },
      { key: 'allowPhone', label: 'Llamadas telefónicas' },
      { key: 'allowWhatsapp', label: 'WhatsApp' },
      { key: 'marketingConsent', label: 'Material de marketing' },
    ];
  
    const handleChange = (key: string, checked: boolean) => {
      onChange({ ...value, [key]: checked });
    };
  
    return (
      <div className="space-y-3">
        {preferences.map(({ key, label }) => (
          <label key={key} className="flex items-center">
            <input
              type="checkbox"
              checked={value[key] || false}
              onChange={(e) => handleChange(key, e.target.checked)}
              className="rounded border-app-dark-600 bg-app-dark-700 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-app-gray-300">{label}</span>
          </label>
        ))}
      </div>
    );
  };

// ============================================
// MAIN COMPONENT (🔥 COMPLETADO Y AJUSTADO)
// ============================================

const ContactForm: React.FC<ContactFormProps> = ({
  contact,
  onSubmit,
  onCancel,
  loading,
  error,
  mode
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<PhoneValidationResult>({ isValid: true });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
    clearErrors
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    // 🔥 Lógica de defaultValues mejorada
    defaultValues: useMemo(() => ({
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      email: contact?.email || '',
      phone: '', // El input local del teléfono siempre empieza vacío. `SmartPhoneInput` lo llenará si hay `initialE164`.
      companyId: contact?.companyId,
      address: contact?.address,
      birthDate: contact?.birthDate ? contact.birthDate.split('T')[0] : '', // Formatear para input[type=date]
      gender: contact?.gender,
      source: contact?.source || 'MANUAL_ENTRY',
      sourceDetails: contact?.sourceDetails,
      customFields: contact?.customFields,
      communicationPreferences: contact?.communicationPreferences,
      tags: contact?.tags?.map(tag => tag.id),
    }), [contact])
  });

  const currentPhone = watch('phone');

  const handleFormSubmit = async (data: ContactFormData) => {
    if (data.phone && !phoneValidation.isValid) {
      setError('phone', { message: 'El teléfono debe ser válido antes de guardar' });
      return;
    }

    const baseSubmitData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || undefined,
      phone: phoneValidation.e164Phone || undefined,
      companyId: data.companyId,
      address: data.address as AddressDTO,
      birthDate: data.birthDate || undefined,
      gender: data.gender as Gender,
      source: data.source as ContactSource,
      sourceDetails: data.sourceDetails,
      customFields: data.customFields,
      communicationPreferences: data.communicationPreferences as CommunicationPreferences,
      tags: data.tags,
    };

    // ✅ SOLUCIÓN: Llamar a onSubmit de forma condicional y explícita
    if (mode === 'edit' && contact) {
      // En esta rama, TypeScript sabe que el objeto debe ser un UpdateContactRequest
      const updateData: UpdateContactRequest = {
        ...baseSubmitData,
        version: contact.version,
      };
      await onSubmit(updateData);
    } else {
      // En esta rama, TypeScript sabe que el objeto debe ser un CreateContactRequest
      const createData: CreateContactRequest = baseSubmitData;
      await onSubmit(createData);
    }
  };

  const handlePhoneValidation = useCallback((result: PhoneValidationResult) => {
    setPhoneValidation(result);
    
    // Actualizar el error del formulario basado en el resultado de la validación
    if (currentPhone && !result.isValid) {
      setError('phone', { message: result.errorMessage || 'Formato de teléfono inválido' });
    } else {
      clearErrors('phone');
    }
  }, [currentPhone, setError, clearErrors]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
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
            label="Nombre"
            name="firstName"
            required
            icon={<User className="h-4 w-4" />}
            error={errors.firstName?.message}
          >
            <input
              {...register('firstName')}
              type="text"
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ingresa el nombre"
            />
          </FormField>

          <FormField
            label="Apellido"
            name="lastName"
            required
            icon={<User className="h-4 w-4" />}
            error={errors.lastName?.message}
          >
            <input
              {...register('lastName')}
              type="text"
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ingresa el apellido"
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
            description="Opcional, pero requerido para acceso al portal"
          >
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="ejemplo@correo.com"
            />
          </FormField>

      {/* 🔥 La única parte del JSX que cambia es el FormField del Teléfono */}
      <FormField
        label="Teléfono"
        name="phone"
        icon={<Phone className="h-4 w-4" />}
        error={errors.phone?.message}
        description="Validación automática con formato E164 estándar"
      >
        <SmartPhoneInput
          value={currentPhone || ''}
          onChange={(phone) => setValue('phone', phone, { shouldValidate: true, shouldDirty: true })}
          onValidationChange={handlePhoneValidation}
          disabled={loading}
          initialE164={contact?.phone} // 🔥 Pasamos el E164 del contacto existente aquí
        />
      </FormField>
      </div>
      </div>

      {/* Source Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-app-gray-100 border-b border-app-dark-700 pb-2">
          Origen del Contacto
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Fuente"
            name="source"
            required
            icon={<Globe className="h-4 w-4" />}
            error={errors.source?.message}
          >
            <select
              {...register('source')}
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {CONTACT_SOURCES.map(source => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Detalles de la fuente"
            name="sourceDetails"
            error={errors.sourceDetails?.message}
            description="Información adicional sobre cómo se obtuvo este contacto"
          >
            <input
              {...register('sourceDetails')}
              type="text"
              className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ej: Formulario de contacto, referido por Juan"
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
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Fecha de nacimiento"
                name="birthDate"
                icon={<User className="h-4 w-4" />}
                error={errors.birthDate?.message}
              >
                <input
                  {...register('birthDate')}
                  type="date"
                  className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </FormField>

              <FormField
                label="Género"
                name="gender"
                icon={<User className="h-4 w-4" />}
                error={errors.gender?.message}
              >
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Seleccionar...</option>
                  {GENDERS.map(gender => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-app-gray-200 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Dirección
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <FormField
                  label="Dirección secundaria"
                  name="address.addressLine2"
                  error={errors.address?.addressLine2?.message}
                >
                  <input
                    {...register('address.addressLine2')}
                    type="text"
                    className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Apartamento, suite, etc."
                  />
                </FormField>

                <FormField
                  label="Ciudad"
                  name="address.city"
                  error={errors.address?.city?.message}
                >
                  <input
                    {...register('address.city')}
                    type="text"
                    className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Cali"
                  />
                </FormField>

                <FormField
                  label="Departamento/Estado"
                  name="address.state"
                  error={errors.address?.state?.message}
                >
                  <input
                    {...register('address.state')}
                    type="text"
                    className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Valle del Cauca"
                  />
                </FormField>

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

                <FormField
                  label="País"
                  name="address.country"
                  error={errors.address?.country?.message}
                >
                  <input
                    {...register('address.country')}
                    type="text"
                    className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Colombia"
                  />
                </FormField>
              </div>
            </div>

            {/* Communication Preferences */}
            <FormField
              label="Preferencias de comunicación"
              name="communicationPreferences"
              description="Selecciona los métodos de comunicación preferidos"
            >
              <Controller
                name="communicationPreferences"
                control={control}
                render={({ field }) => (
                  <CommunicationPreferences
                    value={field.value || {}}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>
          </div>
        )}
      </div>

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
            // ✅ SOLUCIÓN: El '!!' convierte cualquier valor a su equivalente booleano.
            disabled={loading || !!(currentPhone && !phoneValidation.isValid)}
            className="min-w-32"
            >
            {loading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === 'create' ? 'Crear Contacto' : 'Actualizar Contacto'}
          </Button>
      </div>

    </form>
  );
};

export default ContactForm;