// src/components/contacts/ContactDetailHeader.tsx
// Header component especializado para el detalle de contacto

import React from 'react';
import { ArrowLeft, Edit, Trash2, UserPlus, Mail, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { ContactDTO } from '@/types/contact.types';
import { formatPhone } from '@/utils/formatters';
import { ContactStatusBadge } from '@/components/shared/ContactStatusBadge';

// ============================================
// TYPES
// ============================================

interface ContactDetailHeaderProps {
  contact: ContactDTO;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

const ContactDetailHeader: React.FC<ContactDetailHeaderProps> = ({
  contact,
  onBack,
  onEdit,
  onDelete,
  isUpdating,
  isDeleting
}) => {
  const isLoading = isUpdating || isDeleting;

  return (
    <div className="border-b border-app-dark-700 pb-6">
      <div className="flex items-start justify-between">
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
            <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {contact.firstName[0]}{contact.lastName[0]}
              </span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-app-gray-100 truncate">
                {contact.firstName} {contact.lastName}
                {isLoading && (
                  <LoadingSpinner size="sm" className="ml-3 inline-block" />
                )}
              </h1>
              
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <ContactStatusBadge status={contact.status} />
                
                {contact.cognitoSub && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-900/20 text-primary-400 border border-primary-500/30">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Usuario registrado
                  </span>
                )}
              </div>
            </div>

            {/* Quick Contact Details */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-6 text-sm text-app-gray-400">
              {contact.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <a 
                    href={`mailto:${contact.email}`}
                    className="hover:text-primary-400 transition-colors truncate"
                  >
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <a 
                    href={`tel:${contact.phone}`}
                    className="hover:text-primary-400 transition-colors"
                  >
                    {formatPhone(contact.phone)}
                  </a>
                </div>
              )}
            </div>

            {/* Loading states */}
            {isUpdating && (
              <div className="mt-2 text-xs text-yellow-400">
                Actualizando contacto...
              </div>
            )}
            {isDeleting && (
              <div className="mt-2 text-xs text-red-400">
                Eliminando contacto...
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 ml-4">
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

      {/* Contact metadata */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-app-gray-500">
        <span>ID: {contact.id}</span>
        <span>Versión: {contact.version}</span>
        {contact.createdAt && (
          <span>Creado: {new Date(contact.createdAt).toLocaleDateString()}</span>
        )}
        {contact.updatedAt && (
          <span>Actualizado: {new Date(contact.updatedAt).toLocaleDateString()}</span>
        )}
        <span>Fuente: {contact.source}</span>
        {contact.engagementScore !== undefined && (
          <span>Engagement: {contact.engagementScore}%</span>
        )}
      </div>
    </div>
  );
};

export default ContactDetailHeader;