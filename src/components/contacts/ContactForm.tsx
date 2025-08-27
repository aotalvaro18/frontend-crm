// src/components/contacts/ContactForm.tsx
// ✅ VERSIÓN FINAL: Contact form enterprise - E164 estándar y limpio
//Nota: tengo el original funcional antes de refactorizacion phoneinput en docs

import React, { useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { companyApi } from '@/services/api/companyApi';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { 
  User, Mail, Phone, MapPin, Building2, 
  Save, X, AlertCircle, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
//import { COUNTRY_CODES } from '@/utils/constants';
import { GeographySelector } from '@/components/shared/GeographySelector';
import { getCountryName } from '@/utils/geography';
import { FormField } from '@/components/forms/FormField';
import { SmartPhoneInput, type PhoneValidationResult, getRegionFromE164 } from '@/components/forms/PhoneInput';
import type { 
    ContactDTO,
    CreateContactRequest, 
    UpdateContactRequest,
    CommunicationPreferences
  } from '@/types/contact.types';


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
  
  email: z.string().email('Formato de email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  companyId: z.number().nullish(), // Acepta null o undefined
  
  address: addressSchema.optional(),
  
  birthDate: z.string().optional().or(z.literal('')),
  
  // ✅ LA SOLUCIÓN AL ERROR DE GÉNERO: Añadimos .nullable()
  gender: z.union([
    z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
    z.literal(''),
    z.null(),
    z.undefined()
  ]).transform(val => val === '' ? null : val).optional(),
  
  source: z.string().min(1, 'La fuente es requerida'),
  
  sourceDetails: z.string().max(255, 'Los detalles no pueden superar los 255 caracteres').optional().or(z.literal('')),
  
  customFields: z.record(z.any()).optional(),
  communicationPreferences: communicationPreferencesSchema.optional(),
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
  showActions?: boolean; // Para controlar la visibilidad de los botones
}


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
 
 const ContactForm = React.forwardRef<HTMLFormElement, ContactFormProps>(
  ({
    contact,
    onSubmit,
    onCancel,
    loading,
    error,
    mode,
    showActions = true,
  }, ref) => { // <-- Se añade 'ref' aquí
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<PhoneValidationResult>({ isValid: true });
  //const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedCountryFromPhone, setSelectedCountryFromPhone] = useState<string>('');
  const [phoneRegion, setPhoneRegion] = useState<string>('');
 
  const {
    register, control, handleSubmit,
    formState: { errors },
    watch, setValue, setError, clearErrors
    } = useForm<ContactFormData>({
      resolver: zodResolver(contactFormSchema),
      defaultValues: useMemo(() => {
        if (!contact) {
            return { source: 'MANUAL_ENTRY', communicationPreferences: { marketingConsent: false }, tags: [] };
        }
        return {
            firstName: contact.firstName || '',
            lastName: contact.lastName || '',
            email: contact.email || '',
            phone: '', // SmartPhoneInput se encarga de esto
            companyId: contact.companyId,
            // LA CLAVE: Inicializamos el address completo para que se cargue
            address: {
              addressLine1: contact.address?.addressLine1 || '',
              addressLine2: contact.address?.addressLine2 || '',
              city: contact.address?.city || '',
              state: contact.address?.state || '',
              postalCode: contact.address?.postalCode || '',
              country: contact.address?.country || '',
            },
            birthDate: contact.birthDate ? contact.birthDate.split('T')[0] : '',
            gender: contact.gender,
            source: contact.source || 'MANUAL_ENTRY',
            sourceDetails: contact.sourceDetails || '',
            customFields: contact.customFields,
            communicationPreferences: {
              allowEmail: contact?.communicationPreferences?.allowEmail ?? false,
              allowSms: contact?.communicationPreferences?.allowSms ?? false,
              allowPhone: contact?.communicationPreferences?.allowPhone ?? false,
              allowWhatsapp: contact?.communicationPreferences?.allowWhatsapp ?? false,
              allowPostalMail: contact?.communicationPreferences?.allowPostalMail ?? false,
              marketingConsent: contact?.communicationPreferences?.marketingConsent ?? false,
              preferredContactMethod: contact?.communicationPreferences?.preferredContactMethod ?? 'EMAIL',
              preferredTime: contact?.communicationPreferences?.preferredTime ?? 'ANYTIME',
              language: contact?.communicationPreferences?.language ?? 'es'
            },
            tags: contact.tags?.map(tag => tag.id) || [],
        };
    }, [contact]),
  });

  const currentPhone = watch('phone');

  // Hook para cargar empresas
  const { data: companies } = useQuery({
    queryKey: ['companies', 'list'],
    queryFn: () => companyApi.searchCompanies({ size: 100 }),
    staleTime: 5 * 60 * 1000,
  });
 
  const handleFormSubmit = async (data: ContactFormData) => {
    if (data.phone && !phoneValidation.isValid) {
      setError('phone', { message: 'El teléfono debe ser válido antes de guardar' });
      return;
    }
    if (!data.email?.trim() && !phoneValidation.e164Phone) {
      setError('email', { message: 'Debe proporcionar al menos email o teléfono' });
      setError('phone', { message: 'Debe proporcionar al menos email o teléfono' });
      return;
    }

    // "Traducimos" los datos del formulario al formato de la API
    
    const payload: any = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email?.trim() || null,
      phone: phoneValidation.e164Phone || null,
      phoneRegion: phoneRegion || null,
      companyId: data.companyId,
      address: data.address,
      birthDate: data.birthDate === '' ? null : data.birthDate,
      gender: data.gender || null, // Zod ya se encargó de null/undefined
      source: data.source,
      sourceDetails: data.sourceDetails,
      customFields: data.customFields,
      communicationPreferences: data.communicationPreferences,
      // Se omiten los tags hasta que se aclare el mapeo number[] -> string[]
    };
 
    if (mode === 'edit' && contact) {
      const updateData: UpdateContactRequest = {
        ...payload,
        version: contact.version,
      };
      await onSubmit(updateData);
    } else {
      const createData: CreateContactRequest = payload;
      await onSubmit(createData);
    }
};
 
const handlePhoneValidation = useCallback((result: PhoneValidationResult) => {
  setPhoneValidation(result);
  
    if (result.isValid && result.e164Phone) {
      const region = getRegionFromE164(result.e164Phone);

      // --- AQUÍ SE INSERTA TU CÓDIGO ---
      if (mode === 'create' && region !== phoneRegion) {
        setValue('address.state', '');
        setValue('address.city', '');
      }
      // --- FIN DE LA INSERCIÓN ---

      setPhoneRegion(region); // ✅ Guardamos la región
      setSelectedCountryFromPhone(region);
      setValue('address.country', getCountryName(region));
    }
    
    if (currentPhone && !result.isValid) {
      setError('phone', { message: result.errorMessage || 'Formato de teléfono inválido' });
    } else {
      clearErrors('phone');
    }
}, [currentPhone, setError, clearErrors, setValue, mode, phoneRegion]);

  //finalmente
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
            label="Nombre"
            name="firstName"
            required={true}
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
            required={true}
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
          onChange={handlePhoneChange}
          onValidationChange={handlePhoneValidation}
          disabled={loading}
          initialE164={contact?.phone} // 🔥 Pasamos el E164 del contacto existente aquí
        />
      </FormField>
      
      </div>

      {/* Campo de Empresa */}
      <div className="grid grid-cols-1 gap-6">
            <FormField
              label="Empresa"
              name="companyId"
              icon={<Building2 className="h-4 w-4" />}
              error={errors.companyId?.message}
              description="Opcional - empresa a la que pertenece el contacto"
            >
              <select
                {...register('companyId', {
                  setValueAs: (value) => value === '' ? null : parseInt(value, 10)
                })}
                className="w-full px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Sin empresa asignada</option>
                {/* TODO: Cargar empresas desde API */}
                <option value="1">Empresa Demo 1</option>
                <option value="2">Empresa Demo 2</option>
              </select>
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
            required={true}
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
 
            {/* Address - ✅ LAYOUT CORREGIDO Y SIN BUCLES */}
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
        
        {/* --- Fila 1: País y Departamento/Estado --- */}
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
              onCityChange={() => {}} // No hace nada aquí
              disabled={loading || !selectedCountryFromPhone}
              layout="separate"
              renderStateOnly
              errorState={errors.address?.state?.message}
            />
          </FormField>
        </div>

        {/* --- Fila 2: Ciudad y Código Postal --- */}
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
              onStateChange={() => {}} // No hace nada aquí
              // ✅ NUEVO: Auto-llenar código postal
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

        {/* --- Fila 3: Direcciones --- */}
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
              placeholder="Apartamento, suite, etc."
            />
          </FormField>
        </div>
      </div>
    </>
  )}
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
            {mode === 'create' ? 'Crear Contacto' : 'Actualizar Contacto'}
          </Button>
        </div>
      )}
 
    </form>
  );
});
 
export default ContactForm;