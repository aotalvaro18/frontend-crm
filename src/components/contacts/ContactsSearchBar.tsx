// src/components/contacts/ContactsSearchBar.tsx
// Search bar component especializado para contactos

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { ContactSearchCriteria } from '@/types/contact.types';

interface ContactsSearchBarProps {
  onSearch: (criteria: ContactSearchCriteria) => void;
  isSearching: boolean;
  searchCriteria: ContactSearchCriteria;
}

const ContactsSearchBar: React.FC<ContactsSearchBarProps> = ({
  onSearch,
  isSearching,
  searchCriteria
}) => {
  const [searchTerm, setSearchTerm] = useState(searchCriteria.search || '');

  // Sync with external changes
  useEffect(() => {
    if (searchCriteria.search !== searchTerm) {
      setSearchTerm(searchCriteria.search || '');
    }
  }, [searchCriteria.search]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch({ ...searchCriteria, search: value || undefined });
  };

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-app-gray-400" />
      <input
        type="text"
        placeholder="Buscar contactos..."
        value={searchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2 border border-app-dark-600 rounded-md bg-app-dark-700 text-app-gray-100 placeholder-app-gray-400 focus:outline-none focus:bg-app-dark-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
};

export default ContactsSearchBar;