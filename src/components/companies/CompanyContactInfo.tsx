// src/components/companies/CompanyContactInfo.tsx
// Contact info component especializado para el detalle de empresa

import React from 'react';
import { Mail, Phone, MessageSquare, Bell, BellOff, Globe, Users, Building } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { CompanyDTO } from '@/types/company.types';
import { formatters } from '@/utils/formatters';

// ============================================
// TYPES
// ============================================

interface CompanyContactInfoProps {
  company: CompanyDTO;
}

// ============================================
// CONTACT METHOD COMPONENT
// ============================================

interface ContactMethodProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  actionLabel?: string;
  onAction?: () => void;
  verified?: boolean;
}

const ContactMethod: React.FC<ContactMethodProps> = ({
  icon,
  label,
  value,
  href,
  actionLabel,
  onAction,
  verified
}) => (
    <div className="flex items-center justify-between p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
    <div className="flex items-center space-x-3 min-w-0"> {/* ✅ Añadido min-w-0 */}
      <div className="flex-shrink-0 text-app-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <dt className="text-sm font-medium text-app-gray-300">{label}</dt>
        <dd className="mt-1">
          {href ? (
            <a
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="text-sm text-app-gray-100 hover:text-primary-400 transition-colors truncate" // ✅ Añadido truncate
            >
              {value}
            </a>
          ) : (
            <span className="text-sm text-app-gray-100 truncate">{value}</span> // ✅ Añadido truncate
          )}
          {verified && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-900/20 text-green-400">
              Verificado
            </span>
          )}
        </dd>
      </div>
    </div>
    
    {actionLabel && onAction && (
      <Button
        variant="outline"
        size="sm"
        onClick={onAction}
        className="text-app-gray-300 border-app-dark-500 hover:bg-app-dark-600 flex-shrink-0" // ✅ Añadido flex-shrink-0
      >
        {actionLabel}
      </Button>
    )}
  </div>
);

// ============================================
// COMMUNICATION PREFERENCES COMPONENT
// ============================================

interface CommunicationPreferencesProps {
  preferences: Record<string, any>;
}

const CommunicationPreferences: React.FC<CommunicationPreferencesProps> = ({ preferences }) => {
  const preferenceConfig = {
    allowEmail: 'Correo electrónico corporativo',
    allowSms: 'SMS empresarial',
    allowPhone: 'Llamadas comerciales',
    allowWhatsapp: 'WhatsApp Business',
    marketingConsent: 'Material promocional',
    allowNewsletters: 'Boletines informativos'
  };

  const preferenceKeys = Object.keys(preferenceConfig) as (keyof typeof preferenceConfig)[];

  return (
    <div className="space-y-3">
      {preferenceKeys.map((key) => {
        const label = preferenceConfig[key];
        const isEnabled = preferences[key] ?? false;

        return (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-app-gray-300">{label}</span>
            <div className="flex items-center">
              {isEnabled ? (
                <Bell className="h-4 w-4 text-green-400" />
              ) : (
                <BellOff className="h-4 w-4 text-app-gray-500" />
              )}
              <span className={`ml-2 text-sm ${isEnabled ? 'text-green-400' : 'text-app-gray-500'}`}>
                {isEnabled ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const CompanyContactInfo: React.FC<CompanyContactInfoProps> = ({ company }) => {
  const handleSendEmail = () => {
    if (company.email) {
      window.open(`mailto:${company.email}`, '_blank');
    }
  };

  const handleMakeCall = () => {
    if (company.phone) {
      window.open(`tel:${company.phone}`, '_blank');
    }
  };

  const handleSendSMS = () => {
    if (company.phone) {
      window.open(`sms:${company.phone}`, '_blank');
    }
  };

  const handleOpenWebsite = () => {
    if (company.website) {
      // Ensure website has protocol
      const url = company.website.startsWith('http') 
        ? company.website 
        : `https://${company.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700">
      <div className="px-6 py-4 border-b border-app-dark-700">
        <h3 className="text-lg font-medium text-app-gray-100">
          Información de Contacto
        </h3>
      </div>
      
      <div className="px-6 py-6">
        <div className="space-y-4">
          {/* Email corporativo */}
          {company.email ? (
            <ContactMethod
              icon={<Mail className="h-4 w-4" />}
              label="Correo electrónico corporativo"
              value={company.email}
              href={`mailto:${company.email}`}
              actionLabel="Enviar email"
              onAction={handleSendEmail}
              verified={!!company.ownerCognitoSub}
            />
          ) : (
            <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
              <div className="flex items-center space-x-3 text-app-gray-500">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Sin correo electrónico registrado</span>
              </div>
            </div>
          )}

          {/* Teléfono corporativo */}
          {company.phone ? (
            <ContactMethod
              icon={<Phone className="h-4 w-4" />}
              label="Teléfono corporativo"
              value={formatters.phone(company.phone)}
              href={`tel:${company.phone}`}
              actionLabel="Llamar"
              onAction={handleMakeCall}
            />
          ) : (
            <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
              <div className="flex items-center space-x-3 text-app-gray-500">
                <Phone className="h-4 w-4" />
                <span className="text-sm">Sin teléfono registrado</span>
              </div>
            </div>
          )}

          {/* Website corporativo */}
          {company.website ? (
            <ContactMethod
              icon={<Globe className="h-4 w-4" />}
              label="Sitio web corporativo"
              value={company.website.replace(/^https?:\/\//, '')} // Display without protocol
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              actionLabel="Visitar sitio"
              onAction={handleOpenWebsite}
            />
          ) : (
            <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
              <div className="flex items-center space-x-3 text-app-gray-500">
                <Globe className="h-4 w-4" />
                <span className="text-sm">Sin sitio web registrado</span>
              </div>
            </div>
          )}

          {/* SMS empresarial - Solo si tiene teléfono */}
          {company.phone && (
            <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-4 w-4 text-app-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-app-gray-300">SMS empresarial</div>
                    <div className="text-sm text-app-gray-100">{formatters.phone(company.phone)}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendSMS}
                  className="text-app-gray-300 border-app-dark-500 hover:bg-app-dark-600"
                >
                  Enviar SMS
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Preferencias de comunicación */}
        {company.communicationPreferences && Object.keys(company.communicationPreferences).length > 0 && (
          <div className="mt-8">
            <h4 className="text-md font-medium text-app-gray-200 mb-4">
              Preferencias de Comunicación Empresarial
            </h4>
            <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
              <CommunicationPreferences preferences={company.communicationPreferences} />
            </div>
          </div>
        )}

        {/* Metadata de empresa */}
        <div className="mt-6 pt-6 border-t border-app-dark-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-app-gray-500">
            <div>
              <span className="font-medium">Contactos asociados:</span>
              <br />
              <div className="flex items-center space-x-4 mt-1">
                {company.contactCount !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span className="text-app-gray-300">{company.contactCount} total</span>
                  </div>
                )}
                {company.activeContactsCount !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Building className="h-3 w-3 text-green-400" />
                    <span className="text-green-400">{company.activeContactsCount} activos</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <span className="font-medium">Propietario:</span>
              <br />
              <span className="text-app-gray-300">
                {company.ownerName || company.ownerCognitoSub}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyContactInfo;