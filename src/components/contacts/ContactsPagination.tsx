// src/components/contacts/ContactsPagination.tsx
// Pagination component especializado para contactos

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================
// TYPES
// ============================================

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  getPageNumbers: (maxVisible?: number) => number[];
}

interface ContactsPaginationProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  totalContacts: number;
}

// ============================================
// PAGINATION INFO COMPONENT
// ============================================

// ============================================
// DESKTOP PAGINATION COMPONENT
// ============================================

const DesktopPagination: React.FC<{
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  totalContacts: number;
}> = ({ pagination, onPageChange, totalContacts }) => {
  const pageNumbers = pagination.getPageNumbers(5);

  return (
    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-app-gray-400">
          Mostrando{' '}
          <span className="font-medium text-app-gray-300">{pagination.startIndex + 1}</span>
          {' '}a{' '}
          <span className="font-medium text-app-gray-300">{Math.min(pagination.endIndex + 1, totalContacts)}</span>
          {' '}de{' '}
          <span className="font-medium text-app-gray-300">{totalContacts}</span>
          {' '}contactos
        </p>
      </div>
      
      <div>
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          {/* Previous Button */}
          <Button
            variant="outline"
            onClick={pagination.previousPage}
            disabled={pagination.isFirstPage}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border-app-dark-600 bg-app-dark-800 text-app-gray-300 hover:bg-app-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Anterior</span>
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
          
          {/* Page Numbers */}
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === -1) {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center px-4 py-2 border border-app-dark-600 bg-app-dark-800 text-app-gray-500"
                >
                  ...
                </span>
              );
            }
            
            const isCurrentPage = pageNum === pagination.currentPage;
            
            return (
              <Button
                key={pageNum}
                variant={isCurrentPage ? "default" : "outline"}
                onClick={() => onPageChange(pageNum)}
                className={`relative inline-flex items-center px-4 py-2 border ${
                  isCurrentPage
                    ? 'border-primary-500 bg-primary-600 text-white'
                    : 'border-app-dark-600 bg-app-dark-800 text-app-gray-300 hover:bg-app-dark-700'
                }`}
              >
                {pageNum + 1}
              </Button>
            );
          })}
          
          {/* Next Button */}
          <Button
            variant="outline"
            onClick={pagination.nextPage}
            disabled={pagination.isLastPage}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border-app-dark-600 bg-app-dark-800 text-app-gray-300 hover:bg-app-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Siguiente</span>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </div>
  );
};

// ============================================
// MOBILE PAGINATION COMPONENT
// ============================================

const MobilePagination: React.FC<{
  pagination: PaginationData;
  totalContacts: number;
}> = ({ pagination }) => (
  <div className="flex-1 flex justify-between sm:hidden">
    <Button
      variant="outline"
      onClick={pagination.previousPage}
      disabled={pagination.isFirstPage}
      className="relative inline-flex items-center px-4 py-2 border-app-dark-600 bg-app-dark-800 text-app-gray-300 hover:bg-app-dark-700 disabled:opacity-50"
    >
      <ChevronLeft className="h-5 w-5 mr-1" />
      Anterior
    </Button>
    
    <div className="flex items-center space-x-2">
      <span className="text-sm text-app-gray-400">
        Página {pagination.currentPage + 1} de {pagination.totalPages}
      </span>
    </div>
    
    <Button
      variant="outline"
      onClick={pagination.nextPage}
      disabled={pagination.isLastPage}
      className="relative inline-flex items-center px-4 py-2 border-app-dark-600 bg-app-dark-800 text-app-gray-300 hover:bg-app-dark-700 disabled:opacity-50"
    >
      Siguiente
      <ChevronRight className="h-5 w-5 ml-1" />
    </Button>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

const ContactsPagination: React.FC<ContactsPaginationProps> = ({
  pagination,
  onPageChange,
  totalContacts
}) => {
  // Don't render if there's only one page or no items
  if (pagination.totalPages <= 1 || totalContacts === 0) {
    return null;
  }

  return (
    <div className="bg-app-dark-800 border-t border-app-dark-700 px-4 py-3 sm:px-6 rounded-b-lg">
      <div className="flex items-center justify-between">
        {/* Mobile View */}
        <MobilePagination
          pagination={pagination}
          totalContacts={totalContacts}
        />
        
        {/* Desktop View */}
        <DesktopPagination
          pagination={pagination}
          onPageChange={onPageChange}
          totalContacts={totalContacts}
        />
      </div>
      
      {/* Additional Info for Mobile */}
      <div className="mt-3 sm:hidden">
        <div className="text-center">
          <p className="text-xs text-app-gray-500">
            {totalContacts} contactos en total
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactsPagination;