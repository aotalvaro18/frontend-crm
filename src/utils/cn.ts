// src/utils/cn.ts
// ✅ CORREGIDO: Class name utility siguiendo guía TypeScript segura
// Sin errores de index type, compatible con TypeScript 5.4.5

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * ✅ CORREGIDO: Utility for creating component variants
 * Type-safe sin errores de index signature
 */
export interface VariantConfig<T extends Record<string, string | number | boolean>> {
  base?: string;
  variants?: {
    [K in keyof T]?: Record<string, string>;
  };
  compoundVariants?: Array<
    Partial<T> & { class: string }
  >;
  defaultVariants?: Partial<T>;
}

export function createVariants<T extends Record<string, string | number | boolean>>(
  config: VariantConfig<T>
) {
  return (props: Partial<T> & { className?: string }) => {
    // 1. Fusionar las props con las variantes por defecto para tener el estado final
    const propsWithDefaults = { ...config.defaultVariants, ...props };

    // 2. Construir una lista de clases en lugar de un string
    const classes: (string | undefined)[] = [config.base];

    // 3. Aplicar clases de variantes principales de forma segura
    if (config.variants) {
      // Iteramos sobre las claves de las props recibidas
      for (const propName in propsWithDefaults) {
        // Aseguramos que la prop sea una de las variantes definidas (y no 'className')
        if (propName in config.variants) {
          const variantKey = propName as keyof T;
          const variantValue = propsWithDefaults[variantKey];

          if (variantValue !== null && variantValue !== undefined) {
            // Acceso seguro al objeto de variantes y a la clase específica
            const variantClass = config.variants[variantKey]?.[String(variantValue)];
            if (variantClass) {
              classes.push(variantClass);
            }
          }
        }
      }
    }
    
    // 4. Aplicar clases de variantes compuestas de forma segura
    if (config.compoundVariants) {
      config.compoundVariants.forEach(compound => {
        const { class: compoundClass, ...compoundProps } = compound;
        
        // Verificar si todas las props del compound coinciden con el estado final
        const isMatch = Object.entries(compoundProps).every(([key, value]) => {
          return propsWithDefaults[key as keyof T] === value;
        });
        
        if (isMatch) {
          classes.push(compoundClass);
        }
      });
    }
    
    // 5. Usar 'cn' para fusionar todas las clases, resolver conflictos y añadir el className externo
    return cn(classes.filter(Boolean), props.className);
  };
}

// ============================================
// HELPER FUNCTIONS ADICIONALES
// ============================================

/**
 * Helper para crear clases condicionales de forma más legible
 */
export const conditionalClass = (
  condition: boolean,
  trueClass: string,
  falseClass: string = ''
): string => {
  return condition ? trueClass : falseClass;
};

/**
 * Helper para crear clases responsive de forma sencilla
 */
export const responsive = (
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string
): string => {
  const classes = [base];
  
  if (sm) classes.push(`sm:${sm}`);
  if (md) classes.push(`md:${md}`);
  if (lg) classes.push(`lg:${lg}`);
  if (xl) classes.push(`xl:${xl}`);
  
  return classes.join(' ');
};

/**
 * Helper para focus y estados interactivos
 */
export const focusRing = (color: string = 'blue'): string => {
  return `focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-offset-2`;
};

/**
 * Helper para transitions comunes
 */
export const transition = (
  property: 'all' | 'colors' | 'opacity' | 'shadow' | 'transform' = 'all',
  duration: 'fast' | 'normal' | 'slow' = 'normal'
): string => {
  const durations = {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-300'
  };
  
  return `transition-${property} ${durations[duration]} ease-in-out`;
};

// ============================================
// MOBILE-FIRST HELPERS
// ============================================

/**
 * Helper para spacing mobile-first
 */
export const spacing = {
  mobile: (size: number): string => `p-${size}`,
  desktop: (mobile: number, desktop: number): string => `p-${mobile} lg:p-${desktop}`,
  responsive: (xs: number, sm?: number, md?: number, lg?: number): string => {
    const classes = [`p-${xs}`];
    if (sm) classes.push(`sm:p-${sm}`);
    if (md) classes.push(`md:p-${md}`);
    if (lg) classes.push(`lg:p-${lg}`);
    return classes.join(' ');
  }
};

/**
 * Helper para text sizes mobile-first
 */
export const textSize = {
  mobile: (size: 'xs' | 'sm' | 'base' | 'lg' | 'xl'): string => `text-${size}`,
  responsive: (
    mobile: 'xs' | 'sm' | 'base' | 'lg' | 'xl',
    desktop: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  ): string => `text-${mobile} lg:text-${desktop}`
};

/**
 * Helper para grid mobile-first
 */
export const grid = {
  cols: (mobile: number, desktop?: number): string => {
    const classes = [`grid-cols-${mobile}`];
    if (desktop) classes.push(`lg:grid-cols-${desktop}`);
    return classes.join(' ');
  },
  responsive: (xs: number, sm?: number, md?: number, lg?: number): string => {
    const classes = [`grid-cols-${xs}`];
    if (sm) classes.push(`sm:grid-cols-${sm}`);
    if (md) classes.push(`md:grid-cols-${md}`);
    if (lg) classes.push(`lg:grid-cols-${lg}`);
    return classes.join(' ');
  }
};