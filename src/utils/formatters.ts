 // src/utils/formatters.ts
// Enterprise formatters siguiendo tu guía arquitectónica
// Mobile-first, Colombian localization, error handling robusto

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================
// DATE FORMATTERS
// ============================================

/**
 * Format date with Colombian locale
 */
export const formatDate = (date: string | Date | null | undefined, formatStr = 'PPP'): string => {
  if (!date) return 'Sin fecha';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Fecha inválida';
    
    return format(dateObj, formatStr, { locale: es });
  } catch {
    return 'Fecha inválida';
  }
};

/**
 * Format date relative to now (e.g., "hace 2 horas")
 */
export const formatDateRelative = (date: string | Date | null | undefined): string => {
  if (!date) return 'Sin fecha';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Fecha inválida';
    
    return formatDistanceToNow(dateObj, { 
      addSuffix: true, 
      locale: es 
    });
  } catch {
    return 'Fecha inválida';
  }
};

/**
 * Format date for display in forms (YYYY-MM-DD)
 */
export const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

/**
 * Format time only (HH:mm)
 */
export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'Sin hora';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Hora inválida';
    
    return format(dateObj, 'HH:mm');
  } catch {
    return 'Hora inválida';
  }
};

/**
 * Format date and time
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'Sin fecha';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Fecha inválida';
    
    return format(dateObj, 'PPP \'a las\' HH:mm', { locale: es });
  } catch {
    return 'Fecha inválida';
  }
};

// ============================================
// PHONE FORMATTERS (Colombian specific)
// ============================================

/**
 * Format Colombian phone number
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Colombian mobile (10 digits starting with 3)
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Colombian landline (7 digits + area code)
  if (cleaned.length === 10 && !cleaned.startsWith('3')) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Colombian mobile with country code (+57)
  if (cleaned.length === 12 && cleaned.startsWith('57')) {
    const mobile = cleaned.slice(2);
    return `+57 (${mobile.slice(0, 3)}) ${mobile.slice(3, 6)}-${mobile.slice(6)}`;
  }
  
  // International format
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  // Return original if no pattern matches
  return phone;
};

/**
 * Format phone for display in links (tel:)
 */
export const formatPhoneForLink = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if Colombian number
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    return `+57${cleaned}`;
  }
  
  return `+${cleaned}`;
};

// ============================================
// CURRENCY FORMATTERS (Colombian Peso)
// ============================================

/**
 * Format currency in Colombian Pesos
 */
export const formatCurrency = (
  amount: number | null | undefined, 
  currency = 'COP',
  showDecimals = false
): string => {
  if (amount === null || amount === undefined) return '$0';
  
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString('es-CO')}`;
  }
};

/**
 * Format currency for compact display (K, M, B)
 */
export const formatCurrencyCompact = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '$0';
  
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (abs >= 1000000000) {
    return `${sign}$${(abs / 1000000000).toFixed(1)}B`;
  } else if (abs >= 1000000) {
    return `${sign}$${(abs / 1000000).toFixed(1)}M`;
  } else if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(1)}K`;
  }
  
  return formatCurrency(amount);
};

// ============================================
// NUMBER FORMATTERS
// ============================================

/**
 * Format number with Colombian locale
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0';
  
  try {
    return new Intl.NumberFormat('es-CO').format(num);
  } catch {
    return num.toString();
  }
};

/**
 * Format percentage
 */
export const formatPercentage = (
  value: number | null | undefined,
  decimals = 1
): string => {
  if (value === null || value === undefined) return '0%';
  
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  } catch {
    return `${value.toFixed(decimals)}%`;
  }
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format number for compact display (K, M, B)
 */
export const formatNumberCompact = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0';
  
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (abs >= 1000000000) {
    return `${sign}${(abs / 1000000000).toFixed(1)}B`;
  } else if (abs >= 1000000) {
    return `${sign}${(abs / 1000000).toFixed(1)}M`;
  } else if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(1)}K`;
  }
  
  return formatNumber(num);
};

// ============================================
// TEXT FORMATTERS
// ============================================

/**
 * Capitalize first letter of each word
 */
export const formatCapitalize = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format email for display (truncate if too long)
 */
export const formatEmail = (email: string | null | undefined, maxLength = 30): string => {
  if (!email) return '';
  
  if (email.length <= maxLength) return email;
  
  const [local, domain] = email.split('@');
  if (local.length > maxLength - domain.length - 3) {
    return `${local.slice(0, maxLength - domain.length - 6)}...@${domain}`;
  }
  
  return email;
};

/**
 * Truncate text with ellipsis
 */
export const formatTruncate = (
  text: string | null | undefined, 
  maxLength = 50,
  suffix = '...'
): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * Format initials from name
 */
export const formatInitials = (name: string | null | undefined): string => {
  if (!name) return '??';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// ============================================
// ID FORMATTERS (Colombian specific)
// ============================================

/**
 * Format Colombian ID (Cédula)
 */
export const formatColombianId = (id: string | null | undefined): string => {
  if (!id) return '';
  
  const cleaned = id.replace(/\D/g, '');
  
  // Add dots every 3 digits from right
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Format Colombian NIT
 */
export const formatNit = (nit: string | null | undefined): string => {
  if (!nit) return '';
  
  const cleaned = nit.replace(/\D/g, '');
  
  if (cleaned.length >= 10) {
    const main = cleaned.slice(0, -1);
    const checkDigit = cleaned.slice(-1);
    const formatted = main.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted}-${checkDigit}`;
  }
  
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// ============================================
// ADDRESS FORMATTERS
// ============================================

/**
 * Format full address
 */
export const formatAddress = (address: {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
} | null | undefined): string => {
  if (!address) return '';
  
  const parts = [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country
  ].filter(Boolean);
  
  return parts.join(', ');
};

// ============================================
// STATUS FORMATTERS
// ============================================

/**
 * Format boolean as Sí/No
 */
export const formatBoolean = (value: boolean | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A';
  return value ? 'Sí' : 'No';
};

/**
 * Format status with color
 */
export const formatStatus = (status: string | null | undefined): {
  label: string;
  color: string;
} => {
  if (!status) return { label: 'Sin estado', color: 'gray' };
  
  const statusMap: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'Activo', color: 'green' },
    INACTIVE: { label: 'Inactivo', color: 'gray' },
    PENDING: { label: 'Pendiente', color: 'yellow' },
    COMPLETED: { label: 'Completado', color: 'green' },
    CANCELLED: { label: 'Cancelado', color: 'red' },
    ARCHIVED: { label: 'Archivado', color: 'purple' },
  };
  
  return statusMap[status] || { label: status, color: 'gray' };
};

// ============================================
// UTILITY FORMATTERS
// ============================================

/**
 * Format array as comma-separated list
 */
export const formatList = (
  items: string[] | null | undefined,
  conjunction = 'y'
): string => {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(` ${conjunction} `);
  
  const last = items[items.length - 1];
  const rest = items.slice(0, -1);
  return `${rest.join(', ')} ${conjunction} ${last}`;
};

/**
 * Format duration in minutes to human readable
 */
export const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes || minutes <= 0) return '0 min';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

export default {
  // Date formatters
  formatDate,
  formatDateRelative,
  formatDateForInput,
  formatTime,
  formatDateTime,
  
  // Phone formatters
  formatPhone,
  formatPhoneForLink,
  
  // Currency formatters
  formatCurrency,
  formatCurrencyCompact,
  
  // Number formatters
  formatNumber,
  formatPercentage,
  formatFileSize,
  formatNumberCompact,
  
  // Text formatters
  formatCapitalize,
  formatEmail,
  formatTruncate,
  formatInitials,
  
  // ID formatters
  formatColombianId,
  formatNit,
  
  // Other formatters
  formatAddress,
  formatBoolean,
  formatStatus,
  formatList,
  formatDuration,
};
