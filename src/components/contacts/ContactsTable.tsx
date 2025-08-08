// src/components/contacts/ContactsTable.tsx
// Tabla component especializado para contactos

import React from 'react';
import { Mail, Phone, Edit, Trash2, UserPlus, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { ContactDTO } from '@/types/contact.types';
import { formatDate, formatPhone } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { ContactStatusBadge } from '@/components/shared/ContactStatusBadge';


// ============================================
// PROPS INTERFACE
// ============================================

interface ContactsTableProps {
  contacts: ContactDTO[];
  selectedIds: Set<number>;
  updating: Set<number>;
  deleting: Set<number>;
  onContactClick: (id: number) => void;
  onEditContact: (id: number) => void;
  onSelectContact?: (id: number) => void;
  onSelectAll?: (selected: boolean) => void;
  onDeleteContact?: (id: number) => void;
}

// ============================================
// MAIN TABLE COMPONENT
// ============================================

const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts,
  selectedIds,
  updating,
  deleting,
  onContactClick,
  onEditContact,
  onSelectContact,
  onSelectAll,
  onDeleteContact
}) => {
  const allSelected = contacts.length > 0 && contacts.every(c => selectedIds.has(c.id));
  const someSelected = contacts.some(c => selectedIds.has(c.id));

  return (
    <div className="overflow-hidden bg-app-dark-800 shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-app-dark-700">
        <thead className="bg-app-dark-900">
          <tr>
            {onSelectContact && (
              <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                <input
                  type="checkbox"
                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-app-dark-600 bg-app-dark-700 text-primary-600 focus:ring-primary-500"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                />
              </th>
            )}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-app-gray-300 uppercase tracking-wider">
              Contacto
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-app-gray-300 uppercase tracking-wider">
              Email & Teléfono
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-app-gray-300 uppercase tracking-wider">
              Estado
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-app-gray-300 uppercase tracking-wider">
              Empresa
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-app-gray-300 uppercase tracking-wider">
              Fuente
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-app-gray-300 uppercase tracking-wider">
              Última Actividad
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-app-dark-800 divide-y divide-app-dark-700">
          {contacts.map((contact) => {
            const isSelected = selectedIds.has(contact.id);
            const isUpdating = updating.has(contact.id);
            const isDeleting = deleting.has(contact.id);
            const isLoading = isUpdating || isDeleting;

            return (
              <tr
                key={contact.id}
                className={cn(
                  'hover:bg-app-dark-700 transition-colors cursor-pointer',
                  isSelected && 'bg-app-dark-700/50',
                  isLoading && 'opacity-60'
                )}
                onClick={() => !isLoading && onContactClick(contact.id)}
              >
                {onSelectContact && (
                  <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-app-dark-600 bg-app-dark-700 text-primary-600 focus:ring-primary-500"
                      checked={isSelected}
                      disabled={isLoading}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectContact(contact.id);
                      }}
                    />
                  </td>
                )}
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {contact.firstName[0]}{contact.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-app-gray-100">
                        {contact.firstName} {contact.lastName}
                        {isLoading && (
                          <LoadingSpinner size="xs" className="ml-2 inline-block" />
                        )}
                      </div>
                      <div className="text-sm text-app-gray-400 flex items-center space-x-2">
                        {contact.cognitoSub && (
                          <div className="flex items-center">
                            <UserPlus className="h-3 w-3 mr-1" />
                            <span>Usuario registrado</span>
                          </div>
                        )}
                        {isUpdating && <span className="text-xs">Actualizando...</span>}
                        {isDeleting && <span className="text-xs">Eliminando...</span>}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    {contact.email && (
                      <div className="flex items-center text-sm text-app-gray-300">
                        <Mail className="h-3 w-3 mr-2 text-app-gray-400" />
                        <a
                          href={`mailto:${contact.email}`}
                          className="hover:text-primary-400 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center text-sm text-app-gray-300">
                        <Phone className="h-3 w-3 mr-2 text-app-gray-400" />
                        <a
                          href={`tel:${contact.phone}`}
                          className="hover:text-primary-400 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {formatPhone(contact.phone)}
                        </a>
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <ContactStatusBadge status={contact.status} />
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-app-gray-300">
                  {contact.companyId ? (
                    <span>Empresa #{contact.companyId}</span>
                  ) : (
                    <span className="text-app-gray-500">Sin empresa</span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-app-gray-300">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-app-dark-600 text-app-gray-300">
                    {contact.source}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-app-gray-400">
                  {contact.lastActivityAt ? (
                    <div className="flex items-center">
                      <Activity className="h-3 w-3 mr-1" />
                      {formatDate(contact.lastActivityAt)}
                    </div>
                  ) : (
                    <span>Sin actividad</span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditContact(contact.id);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {onDeleteContact && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteContact(contact.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ContactsTable;