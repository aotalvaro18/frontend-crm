// src/components/companies/CompanyDetailHeader.tsx
// Header component especializado para el detalle de empresa

import React from 'react';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import type { CompanyDTO } from '@/types/company.types';
import { formatters } from '@/utils/formatters';
import { 
  getDisplayName, 
  COMPANY_TYPE_LABELS
} from '@/types/company.types';

// ============================================
// COMPANY COMPONENTS (EXTRACTED)
// ============================================
import { CompanyTypeBadge, CompanySizeBadge } from '@/components/companies/CompanyBadges';
import { CompanyAvatar } from '@/components/companies/CompanyAvatar';

// ============================================
// TYPES
// ============================================

interface CompanyDetailHeaderProps {
  company: CompanyDTO;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

const CompanyDetailHeader: React.FC<CompanyDetailHeaderProps> = ({
  company,
  onBack,
  onEdit,
  onDelete,
  isUpdating,
  isDeleting
}) => {
  const isLoading = isUpdating || isDeleting;

  return (
    <div className="border-b border-app-dark-700 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start space-x-4 flex-1">
          {/* Back button - Mobile priority */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 mt-1"
            disabled={isLoading}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Avatar */}
          <div className="flex-shrink-0">
            <CompanyAvatar company={company} size="lg" />
          </div>

          {/* Company Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-app-gray-100">
                {getDisplayName(company)}
                {isLoading && (
                  <LoadingSpinner size="sm" className="ml-3 inline-block" />
                )}
              </h1>
              
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <CompanyTypeBadge type={company.type} />
                
                {company.industry && (
                  <Badge variant="secondary" size="sm" className="text-xs">
                    {company.industry}
                  </Badge>
                )}

                {company.size && (
                  <CompanySizeBadge size={company.size} />
                )}
              </div>
            </div>

            {/* Quick Contact Details */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-6 text-sm text-app-gray-400">
              {company.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <a 
                    href={`mailto:${company.email}`}
                    className="hover:text-primary-400 transition-colors truncate"
                  >
                    {company.email}
                  </a>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <a 
                    href={`tel:${company.phone}`}
                    className="hover:text-primary-400 transition-colors"
                  >
                    {formatters.phone(company.phone)}
                  </a>
                </div>
              )}
              {company.website && (
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  <a 
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-400 transition-colors truncate"
                  >
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            {/* Loading states */}
            {isUpdating && (
              <div className="mt-2 text-xs text-yellow-400">
                Actualizando empresa...
              </div>
            )}
            {isDeleting && (
              <div className="mt-2 text-xs text-red-400">
                Eliminando empresa...
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 sm:ml-4 self-end sm:self-auto">
          <Button 
            variant="outline" 
            onClick={onEdit}
            disabled={isLoading}
          >
            <Edit className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onDelete}
            disabled={isLoading} // Se deshabilita con CUALQUIER carga
            className="text-red-400 border-red-500/30 hover:bg-red-900/20 disabled:opacity-70"
            >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Eliminar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Company metadata */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-app-gray-500">
        <span>ID: {company.id}</span>
        <span>Versión: {company.version}</span>
        {company.createdAt && (
          <span>Creado: {new Date(company.createdAt).toLocaleDateString()}</span>
        )}
        {company.updatedAt && (
          <span>Actualizado: {new Date(company.updatedAt).toLocaleDateString()}</span>
        )}
        <span>Tipo: {COMPANY_TYPE_LABELS[company.type]}</span>
        {company.contactCount !== undefined && (
          <span>Contactos: {company.contactCount}</span>
        )}
        {company.activeContactsCount !== undefined && (
          <span>Activos: {company.activeContactsCount}</span>
        )}
      </div>
    </div>
  );
};

export default CompanyDetailHeader;