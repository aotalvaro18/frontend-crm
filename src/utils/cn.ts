// src/utils/cn.ts
// Utility file for class name composition and style helpers.
// Adopta el estándar de la industria usando clsx y tailwind-merge.

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes with smart conflict resolution.
 * Combines clsx for conditional classes and tailwind-merge for overrides.
 * @param inputs - A list of class values (strings, objects, arrays).
 * @returns A string of final, merged class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================
// HELPER FUNCTIONS ADICIONALES (MANTENIDOS)
// Estos helpers son excelentes y no dependen de la lógica de variantes.
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
  // Asegúrate de que tus colores en tailwind.config.js coincidan (ej. ring-blue-500)
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
// MOBILE-FIRST HELPERS (MANTENIDOS)
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