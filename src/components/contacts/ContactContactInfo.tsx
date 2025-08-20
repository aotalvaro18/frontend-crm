// src/components/contacts/ContactContactInfo.tsx
// Contact info component especializado para el detalle de contacto

import React from 'react';
import { Mail, Phone, MessageSquare, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ContactDTO, CommunicationPreferences as CommunicationPreferencesType } from '@/types/contact.types'; // ✅ CORRECCIÓN: Importa el tipo específico
import { formatPhone } from '@/utils/formatters';

// ============================================
// TYPES
// ============================================

interface ContactContactInfoProps {
  contact: ContactDTO;
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
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0 text-app-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <dt className="text-sm font-medium text-app-gray-300">{label}</dt>
        <dd className="mt-1">
          {href ? (
            <a
              href={href}
              className="text-sm text-app-gray-100 hover:text-primary-400 transition-colors"
            >
              {value}
            </a>
          ) : (
            <span className="text-sm text-app-gray-100">{value}</span>
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
        className="text-app-gray-300 border-app-dark-500 hover:bg-app-dark-600"
      >
        {actionLabel}
      </Button>
    )}
  </div>
);

// ============================================
// COMMUNICATION PREFERENCES COMPONENT (✅ CORREGIDO)
// ============================================

interface CommunicationPreferencesProps {
  // ✅ CORRECCIÓN: Usar el tipo específico CommunicationPreferencesType importado
  preferences: Partial<CommunicationPreferencesType>;
}

const CommunicationPreferences: React.FC<CommunicationPreferencesProps> = ({ preferences }) => {
  // ✅ CORRECCIÓN: Definir las claves y etiquetas en un objeto de configuración
  //    Esto asegura que solo iteremos sobre claves válidas y conocidas.
  const preferenceConfig = {
    allowEmail: 'Correo electrónico',
    allowSms: 'SMS',
    allowPhone: 'Llamadas telefónicas',
    allowWhatsapp: 'WhatsApp',
    marketingConsent: 'Material de marketing',
    // 'marketingConsent' podría venir de otro tipo, lo dejamos fuera por ahora si no está en CommunicationPreferencesType
  };

  // ✅ CORRECCIÓN: Extraer las claves válidas del objeto de configuración
  const preferenceKeys = Object.keys(preferenceConfig) as (keyof typeof preferenceConfig)[];

  return (
    <div className="space-y-3">
      {/* ✅ CORRECCIÓN: Iterar sobre las claves seguras, no sobre un objeto genérico */}
      {preferenceKeys.map((key) => {
        const label = preferenceConfig[key];
        // ✅ CORRECCIÓN: Acceso seguro a la propiedad, con un fallback a 'false'
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

const ContactContactInfo: React.FC<ContactContactInfoProps> = ({ contact }) => {
  const handleSendEmail = () => {
    if (contact.email) {
      window.open(`mailto:${contact.email}`, '_blank');
    }
  };

  const handleMakeCall = () => {
    if (contact.phone) {
      window.open(`tel:${contact.phone}`, '_blank');
    }
  };

  const handleSendSMS = () => {
    if (contact.phone) {
      window.open(`sms:${contact.phone}`, '_blank');
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
          {contact.email ? (
            <ContactMethod
              icon={<Mail className="h-4 w-4" />}
              label="Correo electrónico"
              value={contact.email}
              href={`mailto:${contact.email}`}
              actionLabel="Enviar email"
              onAction={handleSendEmail}
              verified={!!contact.cognitoSub}
            />
          ) : (
            <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
              <div className="flex items-center space-x-3 text-app-gray-500">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Sin correo electrónico registrado</span>
              </div>
            </div>
          )}

          {contact.phone ? (
            <ContactMethod
              icon={<Phone className="h-4 w-4" />}
              label="Teléfono"
              value={formatPhone(contact.phone)}
              href={`tel:${contact.phone}`}
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

          {contact.phone && (
            <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-4 w-4 text-app-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-app-gray-300">SMS</div>
                    <div className="text-sm text-app-gray-100">{formatPhone(contact.phone)}</div>
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

        {contact.communicationPreferences && Object.keys(contact.communicationPreferences).length > 0 && (
          <div className="mt-8">
            <h4 className="text-md font-medium text-app-gray-200 mb-4">
              Preferencias de Comunicación
            </h4>
            <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
              {/* ✅ CORRECCIÓN: Se pasa el objeto de preferencias completo y tipado */}
              <CommunicationPreferences preferences={contact.communicationPreferences} />
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-app-dark-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-app-gray-500">
            {contact.lastActivityAt && (
              <div>
                <span className="font-medium">Última actividad:</span>
                <br />
                {new Date(contact.lastActivityAt).toLocaleString()}
              </div>
            )}
            <div>
              <span className="font-medium">Propietario:</span>
              <br />
              {contact.ownerCognitoSub}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactContactInfo;