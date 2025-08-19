// src/components/contacts/ContactForm.tsx
// ✅ VERSIÓN FINAL: Contact form enterprise - E164 estándar y limpio

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { 
  User, Mail, Phone, MapPin, 
  Save, X, AlertCircle, Check, Globe, CheckCircle2, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { COUNTRY_CODES } from '@/utils/constants';
import { GeographySelector } from '@/components/shared/GeographySelector';
import { getCountryName } from '@/utils/geography';
import type { 
    ContactDTO,               // <-- Este es el alias correcto para 'Contact'
    CreateContactRequest, 
    UpdateContactRequest, 
    ContactSource,
    Gender,
    CommunicationPreferences
  } from '@/types/contact.types';

// ============================================
// E164 PHONE UTILITIES (Mejorado con libphonenumber-js)
// ============================================

interface PhoneValidationResult {
  isValid: boolean;
  e164Phone?: string;
  formattedDisplay?: string;
  errorMessage?: string;
}

/**
 * Extrae la región/país de un número E164 usando libphonenumber-js
 */
const getRegionFromE164 = (e164Phone?: string): string => {
  if (!e164Phone) return 'CO';
  
  try {
    const phoneNumber = parsePhoneNumber(e164Phone);
    return phoneNumber?.country || 'CO';
  } catch {
    return 'CO';
  }
};

/**
 * Formatea un número E164 para display amigable usando libphonenumber-js
 */
const formatPhoneForDisplay = (e164Phone: string): string => {
  if (!e164Phone || !e164Phone.startsWith('+')) return e164Phone;
  
  try {
    const phoneNumber = parsePhoneNumber(e164Phone);
    if (phoneNumber) {
      const country = COUNTRY_CODES.find(c => c.code === phoneNumber.country);
      const flag = country?.flag || '';
      return `${flag} ${phoneNumber.formatInternational()}`;
    }
  } catch (error) {
    console.warn('Error formatting phone:', error);
  }
  
  return e164Phone;
};

/**
 * Valida teléfono con libphonenumber-js - VALIDACIÓN PRECISA
 */
const validatePhoneWithLibphonenumber = async (phone: string, region: string): Promise<PhoneValidationResult> => {
  const trimmedPhone = phone.trim();
  
  // ✅ FIX: Campo vacío es válido
  if (!trimmedPhone) {
    return { isValid: true };
  }
  
  try {
    const country = COUNTRY_CODES.find(c => c.code === region);
    if (!country) {
      return { isValid: false, errorMessage: 'País no soportado' };
    }
    
    // Construir número completo
    const fullNumber = `${country.dialCode}${trimmedPhone}`;
    
    // ✅ FIX: Validación precisa con libphonenumber-js
    const isValid = isValidPhoneNumber(fullNumber, region as any);
    
    if (isValid) {
      const phoneNumber = parsePhoneNumber(fullNumber, region as any);
      return {
        isValid: true,
        e164Phone: phoneNumber?.number,
        formattedDisplay: formatPhoneForDisplay(phoneNumber?.number || fullNumber)
      };
    } else {
      // ✅ FIX: Validación de longitud más precisa
      if (trimmedPhone.length < country.minLength) {
        return { 
          isValid: false, 
          errorMessage: `Mínimo ${country.minLength} dígitos para ${country.name}`
        };
      }
      return { 
        isValid: false, 
        errorMessage: 'Formato de teléfono inválido'
      };
    }
  } catch (error) {
    console.error('Phone validation error:', error);
    return { 
      isValid: false, 
      errorMessage: 'Error al validar teléfono'
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
  
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional().or(z.literal('')),
  
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
  showActions?: boolean; // Para controlar la visibilidad de los botones
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
        {required && <span className="text-red-400 ml-1 text-lg font-bold">*</span>}
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
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
 
  const validatePhone = useCallback(async (phone: string, region: string) => {
    setIsValidating(true);
    try {
      const result = await validatePhoneWithLibphonenumber(phone, region);
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
 
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRY_CODES;
    const search = countrySearch.toLowerCase();
    return COUNTRY_CODES.filter(country => 
      country.name.toLowerCase().includes(search) ||
      country.code.toLowerCase().includes(search) ||
      country.dialCode.includes(search)
    );
  }, [countrySearch]);
  
  const handleCountrySelect = (countryCode: string) => {
    setSelectedRegion(countryCode);
    setIsCountryDropdownOpen(false);
    setCountrySearch('');
    validatePhone(value, countryCode);
  };
 
  const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedRegion);
 
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
 
  // Debounce validation
  useEffect(() => {
    const timer = setTimeout(() => {
      validatePhone(value, selectedRegion);
    }, 500);
 
    return () => clearTimeout(timer);
  }, [value, selectedRegion, validatePhone]);
 
  // useEffect para cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setIsCountryDropdownOpen(false);
      }
    };
    
    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCountryDropdownOpen]);
 
  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        {/* Country Selector personalizado */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
            disabled={disabled}
            className="flex items-center space-x-2 px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:bg-app-dark-600 min-w-[200px]"
          >
            <span className="text-lg">{selectedCountry?.flag}</span>
            <span className="text-sm font-mono">{selectedCountry?.dialCode}</span>
            <span className="text-sm truncate flex-1 text-left">{selectedCountry?.name}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown personalizado */}
          {isCountryDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-app-dark-700 border border-app-dark-600 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
              {/* Campo de búsqueda */}
              <div className="p-2 border-b border-app-dark-600">
                <input
                  type="text"
                  placeholder="Buscar país..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-500 rounded text-app-gray-100 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
              </div>
              
              {/* Lista de países */}
              <div className="overflow-y-auto max-h-48">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country.code)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-app-dark-600 ${
                      selectedCountry?.code === country.code ? 'bg-app-dark-600' : ''
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-mono text-sm w-12">{country.dialCode}</span>
                    <span className="text-sm text-app-gray-200 truncate flex-1">{country.name}</span>
                  </button>
                ))}
                
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-2 text-sm text-app-gray-500">
                    No se encontraron países
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
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
// MAIN COMPONENT (Con la corrección para el crash y la carga de datos)
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
  }, ref) => {
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<PhoneValidationResult>({ isValid: true });
  const [selectedCountryFromPhone, setSelectedCountryFromPhone] = useState<string>('');
 
  // ✅ SOLUCIÓN FINAL: Pre-procesamos los valores para `useForm` aquí mismo, de forma segura.
  const formDefaultValues = useMemo(() => {
    // Para el modo 'create', definimos valores iniciales simples y seguros.
    if (mode === 'create' || !contact) {
      return {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        source: 'MANUAL_ENTRY',
        tags: [],
        // Es importante inicializar esto para que el Controller no reciba `undefined`.
        communicationPreferences: { marketingConsent: false },
      };
    }
    
    // Para el modo 'edit', hacemos la "traducción" para evitar el crash y cargar los datos.
    // 1. Unimos `communicationPreferences` y `marketingConsent` en la estructura que el formulario espera.
    const formCommPrefs = {
      ...(contact.communicationPreferences ?? {}),
      marketingConsent: contact.marketingConsent ?? false,
    };

    // 2. Transformamos el array de objetos `Tag[]` a un array de IDs `number[]`.
    const formTagIds = contact.tags?.map(tag => tag.id) || [];

    // 3. Devolvemos el objeto final, limpio y con la estructura correcta.
    return {
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: '', // SmartPhoneInput se encarga de esto a partir del initialE164
      companyId: contact.companyId,
      address: contact.address,
      birthDate: contact.birthDate ? contact.birthDate.split('T')[0] : '',
      gender: contact.gender,
      source: contact.source || 'MANUAL_ENTRY',
      sourceDetails: contact.sourceDetails,
      customFields: contact.customFields,
      communicationPreferences: formCommPrefs, // Usamos el objeto traducido
      tags: formTagIds,                     // Usamos el array de IDs
    };
  }, [contact, mode]); // Se recalcula si cambia el contacto o el modo.
 
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
    // Usamos los valores pre-procesados y seguros que acabamos de crear.
    defaultValues: formDefaultValues,
  });

  // El resto de tu código (useEffect, handleFormSubmit, JSX) puede quedar como lo tenías.
  // Pero para máxima seguridad, te paso la versión final y correcta de handleFormSubmit.

  useEffect(() => {
    setValue('address.state', '');
    setValue('address.city', '');
  }, [selectedCountryFromPhone, setValue]);

  const watchedState = watch('address.state');
  useEffect(() => {
    setValue('address.city', '');
  }, [watchedState, setValue]);
 
  const currentPhone = watch('phone');
 
  const handleFormSubmit = async (data: ContactFormData) => {
    // 1. Validaciones
    if (data.phone && !phoneValidation.isValid) {
      setError('phone', { message: 'El teléfono debe ser válido antes de guardar' });
      return;
    }
    if (!data.email?.trim() && !phoneValidation.e164Phone) {
      setError('email', { message: 'Debe proporcionar al menos email o teléfono' });
      setError('phone', { message: 'Debe proporcionar al menos email o teléfono' });
      return;
    }

    // 2. "Traducción" Estructural para la API
    const { marketingConsent, ...restOfCommPrefs } = data.communicationPreferences || {};

    // 3. Lógica separada para CREAR y EDITAR
    if (mode === 'edit' && contact) {
      const updateData: UpdateContactRequest = {
        ...contact,
        ...data,
        version: contact.version,
        phone: phoneValidation.e164Phone || undefined,
        gender: (data.gender === '' ? undefined : data.gender) as Gender | undefined,
        birthDate: data.birthDate === '' ? undefined : data.birthDate,
        source: data.source as ContactSource,
        marketingConsent: marketingConsent,
        communicationPreferences: {
          ...(contact.communicationPreferences),
          ...restOfCommPrefs,
        },
        tags: data.tags,
      };
      await onSubmit(updateData);
    } else {
      const defaultCommPrefs: CommunicationPreferences = {
          allowEmail: false, allowSms: false, allowPhone: false, allowWhatsapp: false,
          allowPostalMail: false, preferredContactMethod: 'EMAIL', preferredTime: 'ANYTIME', language: 'es',
      };
      const createData: CreateContactRequest = {
          firstName: data.firstName.trim(), lastName: data.lastName.trim(),
          email: data.email?.trim() || undefined, companyId: data.companyId,
          address: data.address, sourceDetails: data.sourceDetails,
          customFields: data.customFields, phone: phoneValidation.e164Phone || undefined,
          source: data.source as ContactSource,
          birthDate: data.birthDate === '' ? undefined : data.birthDate,
          gender: (data.gender === '' ? undefined : data.gender) as Gender | undefined,
          marketingConsent: marketingConsent,
          communicationPreferences: { ...defaultCommPrefs, ...restOfCommPrefs },
          tags: data.tags,
      };
      await onSubmit(createData);
    }
  };
 
  const handlePhoneValidation = useCallback((result: PhoneValidationResult) => {
    setPhoneValidation(result);
    if (result.isValid && result.e164Phone) {
      const region = getRegionFromE164(result.e164Phone);
      setSelectedCountryFromPhone(region);
      setValue('address.country', getCountryName(region));
    }
    if (currentPhone && !result.isValid) {
      setError('phone', { message: result.errorMessage || 'Formato de teléfono inválido' });
    } else {
      clearErrors('phone');
    }
  }, [currentPhone, setError, clearErrors, setValue]);
 
  return (
    <form ref={ref} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* ... TU JSX COMPLETO VA AQUÍ, SIN NINGÚN CAMBIO ... */}
    </form>
  );
});
 
export default ContactForm;