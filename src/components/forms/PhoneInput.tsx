// src/components/forms/PhoneInput.tsx
// ✅ Componente "inteligente" para input de teléfono con validación E164

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { COUNTRY_CODES } from '@/utils/constants';

// ============================================
// TIPOS Y HELPERS (Necesarios para el componente)
// ============================================

export interface PhoneValidationResult {
  isValid: boolean;
  e164Phone?: string;
  formattedDisplay?: string;
  errorMessage?: string;
}

export const getRegionFromE164 = (e164Phone?: string): string => {
  if (!e164Phone) return 'CO';
  try {
    const phoneNumber = parsePhoneNumberFromString(e164Phone);
    return phoneNumber?.country || 'CO';
  } catch {
    return 'CO';
  }
};

const formatPhoneForDisplay = (e164Phone: string): string => {
  if (!e164Phone || !e164Phone.startsWith('+')) return e164Phone;
  try {
    const phoneNumber = parsePhoneNumberFromString(e164Phone);
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

const validatePhoneWithLibphonenumber = async (phone: string, region: string): Promise<PhoneValidationResult> => {
  const trimmedPhone = phone.trim();
  if (!trimmedPhone) return { isValid: true };
  try {
    const country = COUNTRY_CODES.find(c => c.code === region);
    if (!country) return { isValid: false, errorMessage: 'País no soportado' };
    const fullNumber = `${country.dialCode}${trimmedPhone}`;
    const isValid = isValidPhoneNumber(fullNumber, region as any);
    if (isValid) {
      const phoneNumber = parsePhoneNumberFromString(fullNumber, region as any);
      return { isValid: true, e164Phone: phoneNumber?.number, formattedDisplay: formatPhoneForDisplay(phoneNumber?.number || fullNumber) };
    } else {
      if (trimmedPhone.length < country.minLength) return { isValid: false, errorMessage: `Mínimo ${country.minLength} dígitos para ${country.name}` };
      return { isValid: false, errorMessage: 'Formato de teléfono inválido' };
    }
  } catch (error) {
    console.error('Phone validation error:', error);
    return { isValid: false, errorMessage: 'Error al validar teléfono' };
  }
};

// ============================================
// INTERFAZ DE PROPS
// ============================================

export interface SmartPhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  onValidationChange: (result: PhoneValidationResult) => void;
  disabled?: boolean;
  initialE164?: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const SmartPhoneInput: React.FC<SmartPhoneInputProps> = ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialE164]);

  useEffect(() => {
    const timer = setTimeout(() => {
      validatePhone(value, selectedRegion);
    }, 500);
    return () => clearTimeout(timer);
  }, [value, selectedRegion, validatePhone]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) setIsCountryDropdownOpen(false);
    };
    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCountryDropdownOpen]);

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <div className="relative">
          <button type="button" onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)} disabled={disabled} className="flex items-center space-x-2 px-3 py-2 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:bg-app-dark-600 min-w-[200px]">
            <span className="text-lg">{selectedCountry?.flag}</span>
            <span className="text-sm font-mono">{selectedCountry?.dialCode}</span>
            <span className="text-sm truncate flex-1 text-left">{selectedCountry?.name}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isCountryDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-app-dark-700 border border-app-dark-600 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
              <div className="p-2 border-b border-app-dark-600">
                <input type="text" placeholder="Buscar país..." value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-500 rounded text-app-gray-100 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500" autoFocus />
              </div>
              <div className="overflow-y-auto max-h-48">
                {filteredCountries.map((country) => (
                  <button key={country.code} type="button" onClick={() => handleCountrySelect(country.code)} className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-app-dark-600 ${selectedCountry?.code === country.code ? 'bg-app-dark-600' : ''}`}>
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-mono text-sm w-12">{country.dialCode}</span>
                    <span className="text-sm text-app-gray-200 truncate flex-1">{country.name}</span>
                  </button>
                ))}
                {filteredCountries.length === 0 && (<div className="px-4 py-2 text-sm text-app-gray-500">No se encontraron países</div>)}
              </div>
            </div>
          )}
        </div>
        <div className="relative flex-1">
          <input type="tel" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-full px-3 py-2 pr-10 bg-app-dark-700 border border-app-dark-600 rounded text-app-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder={selectedCountry?.format.replace(/#/g, '0') || '3001234567'} />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValidating ? <LoadingSpinner size="xs" /> : validationResult?.isValid && value ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : validationResult && !validationResult.isValid && value ? <AlertCircle className="h-4 w-4 text-red-400" /> : null}
          </div>
        </div>
      </div>
      {validationResult && !validationResult.isValid && value && (<div className="text-xs text-red-400 flex items-center"><AlertCircle className="h-3 w-3 mr-1" />{validationResult.errorMessage}</div>)}
      {validationResult?.isValid && validationResult.e164Phone && (<div className="text-xs text-green-400 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" />Validado como: {validationResult.formattedDisplay}</div>)}
    </div>
  );
}; 
