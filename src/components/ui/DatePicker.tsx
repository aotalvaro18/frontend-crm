// src/components/ui/DatePicker.tsx
// ✅ DATE PICKER ENTERPRISE COMPONENT
// Mobile-first + TypeScript strict + Multiple formats + Validation + Accessibility

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// ============================================
// DATE PICKER VARIANTS
// ============================================

const datePickerVariants = cva(
  // Base classes - siguiendo Input.tsx patterns
  'relative inline-block w-full',
  {
    variants: {
      variant: {
        default: '',
        outline: '',
        filled: '',
        ghost: '',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
        xl: '',
      },
      state: {
        default: '',
        error: '',
        success: '',
        warning: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  }
);

const inputVariants = cva(
  // Base input classes - aligned con Input.tsx
  'flex w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-app-accent-500 focus:ring-offset-2 ring-offset-app-dark-900',
  {
    variants: {
      variant: {
        default: 'border-app-dark-600 bg-app-dark-700 text-app-gray-100 placeholder-app-gray-500 focus:border-app-accent-500',
        outline: 'border-app-dark-500 bg-app-dark-800 text-app-gray-100 placeholder-app-gray-500 focus:border-app-accent-400',
        filled: 'border-app-dark-700 bg-app-dark-600 text-app-gray-100 placeholder-app-gray-500 focus:border-app-accent-500',
        ghost: 'border-transparent bg-app-dark-750 text-app-gray-100 placeholder-app-gray-500 focus:border-app-dark-500 focus:bg-app-dark-700',
      },
      size: {
        sm: 'h-8 px-3 py-1.5 text-xs',
        md: 'h-10 px-3 py-2 text-sm',
        lg: 'h-12 px-4 py-3 text-base',
        xl: 'h-14 px-5 py-3.5 text-lg',
      },
      state: {
        default: '',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
        warning: 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  }
);

// ============================================
// TYPES
// ============================================

export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD-MM-YYYY';

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange' | 'value'>,
    VariantProps<typeof datePickerVariants> {
  
  // Value and change handling
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange?: (value: string) => void;
  
  // Display format
  displayFormat?: DateFormat;
  
  // Constraints
  minDate?: string; // ISO date string
  maxDate?: string; // ISO date string
  disabledDates?: string[]; // Array of ISO date strings
  
  // Appearance
  placeholder?: string;
  clearable?: boolean;
  showIcon?: boolean;
  
  // Validation
  error?: string;
  success?: string;
  required?: boolean;
  
  // Behavior
  closeOnSelect?: boolean;
  allowTyping?: boolean;
  
  // Localization
  locale?: string;
  weekStartsOn?: 0 | 1; // 0 = Sunday, 1 = Monday
  
  // Classes
  inputClassName?: string;
  calendarClassName?: string;
  
  // Events
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onClear?: () => void;
}

// ============================================
// DATE UTILITIES
// ============================================

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Parsea fecha ISO string a Date object
 */
function parseISODate(dateString: string): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString + 'T00:00:00');
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Convierte Date a ISO string (YYYY-MM-DD)
 */
function formatToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea fecha para display
 */
function formatForDisplay(date: Date, format: DateFormat): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  switch (format) {
    case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'DD-MM-YYYY': return `${day}-${month}-${year}`;
    case 'YYYY-MM-DD': 
    default: return `${year}-${month}-${day}`;
  }
}

/**
 * Parsea input del usuario según formato
 */
function parseUserInput(input: string, format: DateFormat): Date | null {
  if (!input) return null;

  // Limpiar input
  const cleaned = input.replace(/[^\d]/g, '');
  if (cleaned.length !== 8) return null;

  let day: number, month: number, year: number;

  switch (format) {
    case 'DD/MM/YYYY':
    case 'DD-MM-YYYY':
      day = parseInt(cleaned.substr(0, 2), 10);
      month = parseInt(cleaned.substr(2, 2), 10);
      year = parseInt(cleaned.substr(4, 4), 10);
      break;
    case 'MM/DD/YYYY':
      month = parseInt(cleaned.substr(0, 2), 10);
      day = parseInt(cleaned.substr(2, 2), 10);
      year = parseInt(cleaned.substr(4, 4), 10);
      break;
    case 'YYYY-MM-DD':
    default:
      year = parseInt(cleaned.substr(0, 4), 10);
      month = parseInt(cleaned.substr(4, 2), 10);
      day = parseInt(cleaned.substr(6, 2), 10);
      break;
  }

  const date = new Date(year, month - 1, day);
  
  // Validar que la fecha sea válida
  if (date.getFullYear() !== year || 
      date.getMonth() !== month - 1 || 
      date.getDate() !== day) {
    return null;
  }

  return date;
}

/**
 * Verifica si una fecha está deshabilitada
 */
function isDateDisabled(
  date: Date, 
  minDate?: string, 
  maxDate?: string, 
  disabledDates?: string[]
): boolean {
  const isoString = formatToISO(date);
  
  // Check min/max dates
  if (minDate && isoString < minDate) return true;
  if (maxDate && isoString > maxDate) return true;
  
  // Check disabled dates
  if (disabledDates && disabledDates.includes(isoString)) return true;
  
  return false;
}

/**
 * Genera días del calendario
 */
function generateCalendarDays(year: number, month: number, weekStartsOn: 0 | 1 = 1): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Ajustar día de inicio de la semana
  const startDate = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();
  const daysBack = weekStartsOn === 1 
    ? (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    : dayOfWeek;
  startDate.setDate(startDate.getDate() - daysBack);
  
  // Generar 42 días (6 semanas)
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }
  
  return days;
}

// ============================================
// CALENDAR COMPONENT
// ============================================

interface CalendarProps {
  selectedDate?: Date | null;
  viewMonth: number;
  viewYear: number;
  onDateSelect: (date: Date) => void;
  onMonthChange: (month: number, year: number) => void;
  minDate?: string;
  maxDate?: string;
  disabledDates?: string[];
  weekStartsOn?: 0 | 1;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  viewMonth,
  viewYear,
  onDateSelect,
  onMonthChange,
  minDate,
  maxDate,
  disabledDates,
  weekStartsOn = 1,
  className,
}) => {
  const days = generateCalendarDays(viewYear, viewMonth, weekStartsOn);
  const today = new Date();
  
  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      onMonthChange(11, viewYear - 1);
    } else {
      onMonthChange(viewMonth - 1, viewYear);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      onMonthChange(0, viewYear + 1);
    } else {
      onMonthChange(viewMonth + 1, viewYear);
    }
  };

  return (
    <div className={cn(
      'bg-app-dark-800 border border-app-dark-600 rounded-lg shadow-lg p-3',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-1 hover:bg-app-dark-700 rounded transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-app-gray-400" />
        </button>
        
        <h3 className="text-sm font-medium text-app-gray-200">
          {MONTHS[viewMonth]} {viewYear}
        </h3>
        
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-1 hover:bg-app-dark-700 rounded transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-app-gray-400" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {(weekStartsOn === 1 ? WEEKDAYS.slice(1).concat(WEEKDAYS[0]) : WEEKDAYS).map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-app-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === viewMonth;
          const isToday = formatToISO(date) === formatToISO(today);
          const isSelected = selectedDate && formatToISO(date) === formatToISO(selectedDate);
          const isDisabled = isDateDisabled(date, minDate, maxDate, disabledDates);
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => !isDisabled && onDateSelect(date)}
              disabled={isDisabled}
              className={cn(
                'h-8 w-8 flex items-center justify-center text-sm rounded transition-all',
                'hover:bg-app-dark-700 focus:outline-none focus:ring-1 focus:ring-app-accent-500',
                
                // Current month styling
                isCurrentMonth ? 'text-app-gray-200' : 'text-app-gray-600',
                
                // Today styling
                isToday && 'bg-app-accent-500/20 text-app-accent-400 font-medium',
                
                // Selected styling
                isSelected && 'bg-app-accent-500 text-white font-medium',
                
                // Disabled styling
                isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
                
                // Not current month
                !isCurrentMonth && 'opacity-50'
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({
    className,
    inputClassName,
    calendarClassName,
    variant,
    size,
    state,
    value = '',
    onChange,
    displayFormat = 'YYYY-MM-DD',
    minDate,
    maxDate,
    disabledDates,
    placeholder,
    clearable = true,
    showIcon = true,
    error,
    success,
    required,
    closeOnSelect = true,
    allowTyping = true,
    locale = 'es',
    weekStartsOn = 1,
    disabled,
    onFocus,
    onBlur,
    onClear,
    ...props
  }, ref) => {
    
    // ============================================
    // STATE
    // ============================================
    
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ============================================
    // EFFECTS
    // ============================================
    
    // Sync input value with prop value
    useEffect(() => {
      if (value) {
        const date = parseISODate(value);
        if (date) {
          setInputValue(formatForDisplay(date, displayFormat));
          setViewMonth(date.getMonth());
          setViewYear(date.getFullYear());
        } else {
          setInputValue('');
        }
      } else {
        setInputValue('');
      }
    }, [value, displayFormat]);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // ============================================
    // COMPUTED VALUES
    // ============================================
    
    const selectedDate = value ? parseISODate(value) : null;
    const currentState = error ? 'error' : success ? 'success' : state || 'default';
    const hasValue = value.length > 0;

    // ============================================
    // HANDLERS
    // ============================================
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      if (allowTyping) {
        // Try to parse user input
        const parsedDate = parseUserInput(newValue, displayFormat);
        if (parsedDate) {
          const isoString = formatToISO(parsedDate);
          if (!isDateDisabled(parsedDate, minDate, maxDate, disabledDates)) {
            onChange?.(isoString);
            setViewMonth(parsedDate.getMonth());
            setViewYear(parsedDate.getFullYear());
          }
        }
      }
    };

    const handleInputClick = () => {
      if (!disabled) {
        setIsOpen(true);
      }
    };

    const handleDateSelect = (date: Date) => {
      const isoString = formatToISO(date);
      onChange?.(isoString);
      setInputValue(formatForDisplay(date, displayFormat));
      
      if (closeOnSelect) {
        setIsOpen(false);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
      setInputValue('');
      onClear?.();
    };

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(e);
      setIsOpen(true);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
      // Don't close immediately to allow calendar clicks
      setTimeout(() => {
        if (!containerRef.current?.contains(document.activeElement)) {
          setIsOpen(false);
        }
      }, 150);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    // ============================================
    // RENDER
    // ============================================
    
    return (
      <div className={cn(datePickerVariants({ variant, size, state: currentState }), className)} ref={containerRef}>
        <div className="relative">
          {/* Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onClick={handleInputClick}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || `Seleccionar fecha (${displayFormat})`}
              disabled={disabled}
              required={required}
              className={cn(
                inputVariants({ variant, size, state: currentState }),
                showIcon && 'pr-10',
                clearable && hasValue && 'pr-16',
                inputClassName
              )}
              {...props}
            />

            {/* Icons */}
            <div className="absolute inset-y-0 right-0 flex items-center">
              {/* Clear button */}
              {clearable && hasValue && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 hover:bg-app-dark-600 rounded text-app-gray-400 hover:text-app-gray-200 transition-colors mr-1"
                  tabIndex={-1}
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Calendar icon */}
              {showIcon && (
                <div className="p-2 text-app-gray-400">
                <CalendarIcon className="h-4 w-4" />
              </div>
              )}
            </div>
          </div>

          {/* Calendar Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 z-50 mt-1">
              <Calendar
                selectedDate={selectedDate}
                viewMonth={viewMonth}
                viewYear={viewYear}
                onDateSelect={handleDateSelect}
                onMonthChange={(month, year) => {
                  setViewMonth(month);
                  setViewYear(year);
                }}
                minDate={minDate}
                maxDate={maxDate}
                disabledDates={disabledDates}
                weekStartsOn={weekStartsOn}
                className={calendarClassName}
              />
            </div>
          )}
        </div>

        {/* Helper text */}
        {(error || success) && (
          <div className="mt-1 text-xs">
            {error && (
              <p className="text-red-400">{error}</p>
            )}
            {success && !error && (
              <p className="text-green-400">{success}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

// ============================================
// SPECIALIZED COMPONENTS
// ============================================

/**
 * Date Range Picker - Para selección de rangos
 */
export interface DateRangePickerProps extends Omit<DatePickerProps, 'value' | 'onChange'> {
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  onRangeChange?: (startDate: string, endDate: string) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onRangeChange,
  className,
  ...props
}) => {
  const handleStartChange = (date: string) => {
    onStartDateChange?.(date);
    if (endDate) {
      onRangeChange?.(date, endDate);
    }
  };

  const handleEndChange = (date: string) => {
    onEndDateChange?.(date);
    if (startDate) {
      onRangeChange?.(startDate, date);
    }
  };

  return (
    <div className={cn('flex space-x-2', className)}>
      <DatePicker
        value={startDate}
        onChange={handleStartChange}
        placeholder="Fecha inicio"
        maxDate={endDate} // No permitir fecha inicio después de fecha fin
        {...props}
      />
      <DatePicker
        value={endDate}
        onChange={handleEndChange}
        placeholder="Fecha fin"
        minDate={startDate} // No permitir fecha fin antes de fecha inicio
        {...props}
      />
    </div>
  );
};

/**
 * Quick Date Picker - Para fechas comunes
 */
export const QuickDatePicker: React.FC<Omit<DatePickerProps, 'size'>> = (props) => (
  <DatePicker
    {...props}
    size="sm"
    displayFormat="DD/MM/YYYY"
    closeOnSelect={true}
    allowTyping={false}
  />
);

export default DatePicker;
