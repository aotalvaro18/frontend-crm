// src/components/contacts/ContactsEmptyState.tsx
// Empty state component especializado para contactos

import React from 'react';
import { Users, Search, Filter, Plus, FileX } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================
// TYPES
// ============================================

interface ContactsEmptyStateProps {
  type?: 'empty' | 'filtered' | 'search' | 'error';
  onCreateContact?: () => void;
  onClearFilters?: () => void;
  onClearSearch?: () => void;
  searchTerm?: string;
  errorMessage?: string;
}

// ============================================
// EMPTY STATE CONFIGURATIONS
// ============================================

const getEmptyStateConfig = (
  type: string,
  searchTerm?: string,
  errorMessage?: string
) => {
  switch (type) {
    case 'filtered':
      return {
        icon: <Filter className="w-12 h-12" />,
        title: 'No se encontraron contactos',
        description: 'No hay contactos que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda.',
        iconColor: 'text-yellow-400',
        iconBgColor: 'bg-yellow-900/20'
      };
      
    case 'search':
      return {
        icon: <Search className="w-12 h-12" />,
        title: 'Sin resultados',
        description: searchTerm 
          ? `No se encontraron contactos para "${searchTerm}". Verifica la ortografía o intenta con otros términos.`
          : 'No se encontraron contactos con los términos de búsqueda.',
        iconColor: 'text-blue-400',
        iconBgColor: 'bg-blue-900/20'
      };
      
    case 'error':
      return {
        icon: <FileX className="w-12 h-12" />,
        title: 'Error al cargar contactos',
        description: errorMessage || 'Ocurrió un error al cargar los contactos. Por favor, intenta nuevamente.',
        iconColor: 'text-red-400',
        iconBgColor: 'bg-red-900/20'
      };
      
    default: // 'empty'
      return {
        icon: <Users className="w-12 h-12" />,
        title: 'No hay contactos',
        description: 'Aún no tienes contactos registrados. Comienza agregando tu primer contacto para empezar a construir tu base de datos.',
        iconColor: 'text-app-gray-400',
        iconBgColor: 'bg-app-dark-700'
      };
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

const ContactsEmptyState: React.FC<ContactsEmptyStateProps> = ({
  type = 'empty',
  onCreateContact,
  onClearFilters,
  onClearSearch,
  searchTerm,
  errorMessage
}) => {
  const config = getEmptyStateConfig(type, searchTerm, errorMessage);

  const renderActions = () => {
    switch (type) {
      case 'filtered':
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            {onClearFilters && (
              <Button variant="outline" onClick={onClearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            )}
            {onCreateContact && (
              <Button onClick={onCreateContact}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Contacto
              </Button>
            )}
          </div>
        );
        
      case 'search':
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            {onClearSearch && (
              <Button variant="outline" onClick={onClearSearch}>
                <Search className="h-4 w-4 mr-2" />
                Limpiar Búsqueda
              </Button>
            )}
            {onCreateContact && (
              <Button onClick={onCreateContact}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Contacto
              </Button>
            )}
          </div>
        );
        
      case 'error':
        return (
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        );
        
      default: // 'empty'
        return onCreateContact ? (
          <Button onClick={onCreateContact}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Primer Contacto
          </Button>
        ) : null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      {/* Icon */}
      <div className={`w-16 h-16 mx-auto mb-6 p-4 rounded-full ${config.iconBgColor}`}>
        <div className={config.iconColor}>
          {config.icon}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-semibold text-app-gray-100 mb-3">
          {config.title}
        </h3>
        <p className="text-app-gray-400 mb-6 leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* Actions */}
      {renderActions()}

      {/* Additional Help Text */}
      {type === 'empty' && (
        <div className="mt-8 p-4 bg-app-dark-700 rounded-lg border border-app-dark-600 max-w-md">
          <h4 className="text-sm font-medium text-app-gray-200 mb-2">
            💡 Consejos para empezar:
          </h4>
          <ul className="text-xs text-app-gray-400 space-y-1 text-left">
            <li>• Importa contactos desde un archivo CSV</li>
            <li>• Conecta con tu sistema de email</li>
            <li>• Invita a miembros a registrarse en el portal</li>
            <li>• Sincroniza desde otras plataformas</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ContactsEmptyState;