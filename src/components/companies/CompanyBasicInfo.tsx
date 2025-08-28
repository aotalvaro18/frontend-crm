// src/components/companies/CompanyBasicInfo.tsx
// Basic info component especializado para el detalle de empresa

import React from 'react';
import { Building, MapPin, Users, Tag, DollarSign, Briefcase } from 'lucide-react';
import type { CompanyDTO } from '@/types/company.types';
import { formatters } from '@/utils/formatters';
import { 
  getDisplayName,
  isActiveCompany
} from '@/types/company.types';
import { CompanyTypeBadge, CompanySizeBadge } from '@/components/companies/CompanyBadges';
import { TagsDisplay } from '@/components/shared/TagBadge'; // ✅ Importado el componente compartido
import { INDUSTRY_LABELS } from '@/types/company.types';

// ============================================
// TYPES
// ============================================

interface CompanyBasicInfoProps {
  company: CompanyDTO;
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
// COMPANY TYPE DISPLAY
// ============================================

const CompanyTypeDisplay: React.FC<{ type: CompanyDTO['type'] }> = ({ type }) => {
  return <CompanyTypeBadge type={type} />;
};

// ============================================
// COMPANY SIZE DISPLAY
// ============================================

const CompanySizeDisplay: React.FC<{ size?: CompanyDTO['size'] }> = ({ size }) => {
  if (!size) return <span className="text-app-gray-500">No especificado</span>;
  
  return <CompanySizeBadge size={size} />;
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
// REVENUE DISPLAY
// ============================================

const RevenueDisplay: React.FC<{ revenue?: number }> = ({ revenue }) => {
  if (!revenue) return <span className="text-app-gray-500">No especificado</span>;
  
  return (
    <div className="flex items-center space-x-2">
      <span className="text-lg font-semibold text-green-400">
        {formatters.currency(revenue)}
      </span>
      <span className="text-xs text-app-gray-400">USD anuales</span>
    </div>
  );
};

// ============================================
// CONTACTS COUNT DISPLAY
// ============================================

const ContactsCountDisplay: React.FC<{ 
  contactCount?: number; 
  activeContactsCount?: number; 
}> = ({ contactCount, activeContactsCount }) => {
  if (!contactCount && !activeContactsCount) {
    return <span className="text-app-gray-500">Sin contactos asociados</span>;
  }

  return (
    <div className="flex items-center space-x-4">
      {contactCount !== undefined && (
        <div className="flex items-center space-x-1">
          <span className="text-lg font-semibold text-app-gray-100">{contactCount}</span>
          <span className="text-sm text-app-gray-400">total</span>
        </div>
      )}
      {activeContactsCount !== undefined && (
        <div className="flex items-center space-x-1">
          <span className="text-lg font-semibold text-green-400">{activeContactsCount}</span>
          <span className="text-sm text-app-gray-400">activos</span>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const CompanyBasicInfo: React.FC<CompanyBasicInfoProps> = ({ company }) => {
  return (
    <div className="bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700">
      <div className="px-6 py-4 border-b border-app-dark-700">
        <h3 className="text-lg font-medium text-app-gray-100">
          Información Básica
        </h3>
      </div>
      
      <div className="px-6 py-6">
        <dl className="space-y-6">
          {/* Nombre de la empresa */}
          <InfoField
            icon={<Building className="h-4 w-4" />}
            label="Nombre de la empresa"
            value={getDisplayName(company)}
          />

          {/* Tipo de empresa */}
          <InfoField
            icon={<Building className="h-4 w-4" />}
            label="Tipo de organización"
            value={<CompanyTypeDisplay type={company.type} />}
          />

          {/* Tamaño de empresa */}
          {company.size && (
            <InfoField
              icon={<Users className="h-4 w-4" />}
              label="Tamaño de empresa"
              value={<CompanySizeDisplay size={company.size} />}
            />
          )}

          {/* Industria */}
          {company.industry && (
            <InfoField
              icon={<Briefcase className="h-4 w-4" />}
              label="Industria"
              value={
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-app-dark-600 text-app-gray-300">
                  {/* ✅ CAMBIO: Usar el objeto de etiquetas para traducir el valor */}
                  {INDUSTRY_LABELS[company.industry as keyof typeof INDUSTRY_LABELS] || company.industry}
                </span>
              }
            />
          )}

          {/* Revenue anual */}
          {company.annualRevenue && (
            <InfoField
              icon={<DollarSign className="h-4 w-4" />}
              label="Ingresos anuales"
              value={<RevenueDisplay revenue={company.annualRevenue} />}
            />
          )}

          {/* Dirección */}
          <InfoField
            icon={<MapPin className="h-4 w-4" />}
            label="Dirección"
            value={<AddressDisplay address={company.address} />}
          />

          {/* Contactos asociados */}
          <InfoField
            icon={<Users className="h-4 w-4" />}
            label="Contactos asociados"
            value={
              <ContactsCountDisplay 
                contactCount={company.contactCount}
                activeContactsCount={company.activeContactsCount}
              />
            }
          />

          {/* Etiquetas - ✅ AHORA USA EL COMPONENTE COMPARTIDO */}
          {company.tags && company.tags.length > 0 && (
            <InfoField
              icon={<Tag className="h-4 w-4" />}
              label="Etiquetas"
              value={<TagsDisplay tags={company.tags} />}
            />
          )}

          {/* Estado de actividad */}
          <InfoField
            icon={<Building className="h-4 w-4" />}
            label="Estado"
            value={
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isActiveCompany(company) 
                    ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-900/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {isActiveCompany(company) ? 'Activa' : 'Inactiva'}
                </span>
                {company.activeContactsCount !== undefined && company.activeContactsCount > 0 && (
                  <span className="text-xs text-app-gray-400">
                    {company.activeContactsCount} contactos activos
                  </span>
                )}
              </div>
            }
          />
        </dl>
      </div>
    </div>
  );
};

export default CompanyBasicInfo;