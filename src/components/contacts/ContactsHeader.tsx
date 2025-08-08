// src/components/contacts/ContactsHeader.tsx
// Header component especializado para la lista de contactos

import React from 'react';
import { Plus, Download, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ContactsHeaderProps {
  totalContacts: number;
  isOnline: boolean;
  onCreateContact: () => void;
  onExport: (format: 'csv' | 'excel') => void;
  loading: boolean;
}

const ContactsHeader: React.FC<ContactsHeaderProps> = ({
  totalContacts,
  isOnline,
  onCreateContact,
  onExport,
  loading
}) => {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-app-gray-100">
          Contactos
        </h1>
        <p className="text-app-gray-400 mt-1">
          {totalContacts} {totalContacts === 1 ? 'contacto' : 'contactos'} total
          {!isOnline && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-800">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </span>
          )}
        </p>
      </div>
      
      {/* Desktop Actions */}
      <div className="hidden sm:flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => onExport('csv')}
          disabled={loading || totalContacts === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => onExport('excel')}
          disabled={loading || totalContacts === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Excel
        </Button>
        <Button onClick={onCreateContact}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Contacto
        </Button>
      </div>

      {/* Mobile Actions */}
      <div className="sm:hidden">
        <Button onClick={onCreateContact} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Contacto
        </Button>
      </div>
    </div>
  );
};

export default ContactsHeader;