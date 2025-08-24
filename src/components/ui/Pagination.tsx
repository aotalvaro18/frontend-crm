// src/components/ui/Pagination.tsx
// ✅ Componente de paginación reutilizable y accesible

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/cn';

interface PaginationProps {
  currentPage: number; // 1-based (más intuitivo para la UI)
  totalPages: number;
  onPageChange: (page: number) => void; // Devuelve la nueva página 1-based
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) {
    return null; // No mostrar paginación si solo hay una página
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getPaginationItems = () => {
    const items: (number | '...')[] = [];
    const pageRange = 2; // Cuántos números mostrar alrededor de la página actual

    // Siempre mostrar la primera página
    items.push(1);

    // Puntos suspensivos si la página actual está lejos del principio
    if (currentPage > pageRange + 1) {
      items.push('...');
    }

    // Páginas alrededor de la actual
    for (let i = Math.max(2, currentPage - pageRange); i <= Math.min(totalPages - 1, currentPage + pageRange); i++) {
      items.push(i);
    }

    // Puntos suspensivos si la página actual está lejos del final
    if (currentPage < totalPages - pageRange) {
      items.push('...');
    }
    
    // Siempre mostrar la última página
    if (totalPages > 1) {
      items.push(totalPages);
    }

    // Eliminar duplicados si los rangos se superponen
    return [...new Set(items)];
  };

  const paginationItems = getPaginationItems();

  return (
    <nav aria-label="Paginación" className={cn('flex items-center justify-between gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="Ir a la página anterior"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Anterior
      </Button>
      
      <div className="hidden sm:flex items-center gap-1">
        {paginationItems.map((item, index) =>
          item === '...' ? (
            <span key={`ellipsis-${index}`} className="flex items-center justify-center w-9 h-9">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <Button
              key={item}
              variant={item === currentPage ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => onPageChange(item)}
              aria-current={item === currentPage ? 'page' : undefined}
            >
              {item}
            </Button>
          )
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="Ir a la siguiente página"
      >
        Siguiente
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </nav>
  );
}; 
