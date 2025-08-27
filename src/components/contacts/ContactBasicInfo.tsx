// src/components/contacts/ContactBasicInfo.tsx
// Basic info component especializado para el detalle de contacto

import React from 'react';
import { User, Calendar, MapPin, Building, Tag } from 'lucide-react';
import type { ContactDTO } from '@/types/contact.types';
import { formatDate } from '@/utils/formatters';
import { Link } from 'react-router-dom';

// ============================================
// TYPES
// ============================================

interface ContactBasicInfoProps {
  contact: ContactDTO;
}

// ============================================
// INFO FIELD COMPONENT
// ============================================

interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

const InfoField: React.FC<InfoFieldProps> = ({ icon, label, value, className }) => (
  <div className={`flex items-start space-x-3 ${className}`}>
    <div className="flex-shrink-0 mt-0.5 text-app-gray-400">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <dt className="text-sm font-medium text-app-gray-300">{label}</dt>
      <dd className="mt-1 text-sm text-app-gray-100">{value}</dd>
    </div>
  </div>
);

// ============================================
// GENDER DISPLAY
// ============================================

const GenderDisplay: React.FC<{ gender?: string }> = ({ gender }) => {
  const genderLabels = {
    'MALE': 'Masculino',
    'FEMALE': 'Femenino',
    'OTHER': 'Otro',
    'PREFER_NOT_TO_SAY': 'Prefiere no decir'
  };

  if (!gender) return <span className="text-app-gray-500">No especificado</span>;
  
  return (
    <span>
      {genderLabels[gender as keyof typeof genderLabels] || gender}
    </span>
  );
};

// ============================================
// ADDRESS DISPLAY
// ============================================

const AddressDisplay: React.FC<{ address?: any }> = ({ address }) => {
  if (!address) return <span className="text-app-gray-500">No especificada</span>;

  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country
  ].filter(Boolean);

  if (parts.length === 0) {
    return <span className="text-app-gray-500">No especificada</span>;
  }

  return (
    <div className="space-y-1">
      {address.addressLine1 && <div>{address.addressLine1}</div>}
      {address.addressLine2 && <div>{address.addressLine2}</div>}
      <div>
        {[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}
      </div>
      {address.country && <div>{address.country}</div>}
    </div>
  );
};

// ============================================
// TAGS DISPLAY
// ============================================

const TagsDisplay: React.FC<{ tags: any[] }> = ({ tags }) => {
  if (!tags || tags.length === 0) {
    return <span className="text-app-gray-500">Sin etiquetas</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: tag.color ? `${tag.color}20` : '#374151',
            color: tag.color || '#9CA3AF',
            border: `1px solid ${tag.color ? `${tag.color}40` : '#4B5563'}`
          }}
        >
          <Tag className="h-3 w-3 mr-1" />
          {tag.name}
        </span>
      ))}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const ContactBasicInfo: React.FC<ContactBasicInfoProps> = ({ contact }) => {
  return (
    <div className="bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700">
      <div className="px-6 py-4 border-b border-app-dark-700">
        <h3 className="text-lg font-medium text-app-gray-100">
          Información Básica
        </h3>
      </div>
      
      <div className="px-6 py-6">
        <dl className="space-y-6">
          {/* Nombre completo */}
          <InfoField
            icon={<User className="h-4 w-4" />}
            label="Nombre completo"
            value={`${contact.firstName} ${contact.lastName}`}
          />

          {/* Género */}
          <InfoField
            icon={<User className="h-4 w-4" />}
            label="Género"
            value={<GenderDisplay gender={contact.gender} />}
          />

          {/* Fecha de nacimiento */}
          {contact.birthDate && (
            <InfoField
              icon={<Calendar className="h-4 w-4" />}
              label="Fecha de nacimiento"
              value={formatDate(contact.birthDate)}
            />
          )}

          {/* Dirección */}
          <InfoField
            icon={<MapPin className="h-4 w-4" />}
            label="Dirección"
            value={<AddressDisplay address={contact.address} />}
          />

          {/* Empresa */}
          <InfoField
            icon={<Building className="h-4 w-4" />}
            label="Empresa"
            value={
              contact.companyId ? (
                <Link 
                  to={`/companies/${contact.companyId}`}
                  // 👇 ESTA ES LA LÍNEA QUE VAMOS A CAMBIAR 👇
                  className="font-medium text-blue-500 hover:text-blue-400 hover:underline transition-colors inline-flex items-center"
                >
                  <Building className="h-3 w-3 mr-1" />
                  {contact.companyName || `Empresa #${contact.companyId}`}
                </Link>
              ) : (
                <span className="text-app-gray-500">Sin empresa asignada</span>
              )
            }
          />

          {/* Fuente */}
          <InfoField
            icon={<User className="h-4 w-4" />}
            label="Fuente de contacto"
            value={
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-app-dark-600 text-app-gray-300">
                  {contact.source}
                </span>
                {contact.sourceDetails && (
                  <div className="mt-1 text-xs text-app-gray-400">
                    {contact.sourceDetails}
                  </div>
                )}
              </div>
            }
          />

          {/* Etiquetas */}
          <InfoField
            icon={<Tag className="h-4 w-4" />}
            label="Etiquetas"
            value={<TagsDisplay tags={contact.tags} />}
          />

          {/* Engagement Score */}
          {contact.engagementScore !== undefined && (
            <InfoField
              icon={<User className="h-4 w-4" />}
              label="Puntuación de engagement"
              value={
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-app-gray-100">
                    {contact.engagementScore}%
                  </span>
                  <div className="flex-1 max-w-32">
                    <div className="w-full bg-app-dark-600 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(contact.engagementScore, 100)}%`,
                          backgroundColor: 
                            contact.engagementScore >= 80 ? '#10B981' :
                            contact.engagementScore >= 60 ? '#F59E0B' :
                            contact.engagementScore >= 40 ? '#EF4444' : '#6B7280'
                        }}
                      />
                    </div>
                  </div>
                </div>
              }
            />
          )}
        </dl>
      </div>
    </div>
  );
};

export default ContactBasicInfo;