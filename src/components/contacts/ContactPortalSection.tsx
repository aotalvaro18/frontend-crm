// src/components/contacts/ContactPortalSection.tsx
// Portal section component especializado para el detalle de contacto

import React, { useState } from 'react';
import { 
  Globe, Send, RotateCcw, UserX, CheckCircle, Clock, 
  AlertCircle, TrendingUp, Calendar, ExternalLink,
  Shield, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { ContactDTO } from '@/types/contact.types';
import { formatDate } from '@/utils/formatters';

// ============================================
// TYPES
// ============================================

interface ContactPortalSectionProps {
  contact: ContactDTO;
  onGenerateInvitation: () => Promise<void>;
  onResendInvitation: () => Promise<void>;
  onRevokeAccess: () => Promise<void>;
}

// ============================================
// PORTAL STATUS COMPONENT
// ============================================

interface PortalStatusProps {
  contact: ContactDTO;
}

const PortalStatus: React.FC<PortalStatusProps> = ({ contact }) => {
  if (contact.hasDigitalPortal) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-400" />
        <div>
          <div className="text-sm font-medium text-green-400">Portal Activo</div>
          <div className="text-xs text-green-300">El usuario tiene acceso al portal digital</div>
        </div>
      </div>
    );
  }
  
  if (contact.portalInvitationSent) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
        <Clock className="h-5 w-5 text-yellow-400" />
        <div>
          <div className="text-sm font-medium text-yellow-400">Invitación Enviada</div>
          <div className="text-xs text-yellow-300">
            Enviada el {formatDate(contact.portalInvitationSent)}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-2 p-3 bg-app-dark-700 border border-app-dark-600 rounded-lg">
      <AlertCircle className="h-5 w-5 text-app-gray-400" />
      <div>
        <div className="text-sm font-medium text-app-gray-300">Sin Portal</div>
        <div className="text-xs text-app-gray-400">El usuario no tiene acceso al portal digital</div>
      </div>
    </div>
  );
};

// ============================================
// PORTAL METRICS COMPONENT
// ============================================

interface PortalMetricsProps {
  contact: ContactDTO;
}

const PortalMetrics: React.FC<PortalMetricsProps> = ({ contact }) => {
  if (!contact.hasDigitalPortal) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Digital Engagement Score */}
      {contact.digitalEngagementScore !== undefined && (
        <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-app-gray-400" />
              <span className="text-sm font-medium text-app-gray-300">Engagement Digital</span>
            </div>
            <span className="text-lg font-bold text-app-gray-100">
              {contact.digitalEngagementScore}%
            </span>
          </div>
          <div className="w-full bg-app-dark-600 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(contact.digitalEngagementScore, 100)}%`,
                backgroundColor: 
                  contact.digitalEngagementScore >= 80 ? '#10B981' :
                  contact.digitalEngagementScore >= 60 ? '#F59E0B' :
                  contact.digitalEngagementScore >= 40 ? '#EF4444' : '#6B7280'
              }}
            />
          </div>
        </div>
      )}

      {/* Last Portal Activity */}
      {contact.lastPortalActivity && (
        <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-4 w-4 text-app-gray-400" />
            <span className="text-sm font-medium text-app-gray-300">Última Actividad</span>
          </div>
          <span className="text-sm text-app-gray-100">
            {formatDate(contact.lastPortalActivity)}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// PORTAL ACTIONS COMPONENT
// ============================================

interface PortalActionsProps {
  contact: ContactDTO;
  onGenerateInvitation: () => Promise<void>;
  onResendInvitation: () => Promise<void>;
  onRevokeAccess: () => Promise<void>;
}

const PortalActions: React.FC<PortalActionsProps> = ({
  contact,
  onGenerateInvitation,
  onResendInvitation,
  onRevokeAccess
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<void>, actionName: string) => {
    setLoading(actionName);
    try {
      await action();
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
    } finally {
      setLoading(null);
    }
  };

  // Si no tiene email, no puede acceder al portal
  if (!contact.email) {
    return (
      <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <span className="text-sm text-yellow-300">
            Se requiere un email para generar acceso al portal
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!contact.hasDigitalPortal && !contact.portalInvitationSent && (
        <Button
          onClick={() => handleAction(onGenerateInvitation, 'generate')}
          disabled={loading !== null}
          className="w-full"
        >
          {loading === 'generate' ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Generar Invitación al Portal
        </Button>
      )}

      {contact.portalInvitationSent && !contact.hasDigitalPortal && (
        <Button
          variant="outline"
          onClick={() => handleAction(onResendInvitation, 'resend')}
          disabled={loading !== null}
          className="w-full"
        >
          {loading === 'resend' ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-2" />
          )}
          Reenviar Invitación
        </Button>
      )}

      {contact.hasDigitalPortal && (
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open('/portal', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Portal
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleAction(onRevokeAccess, 'revoke')}
            disabled={loading !== null}
            className="w-full text-red-400 border-red-500/30 hover:bg-red-900/20"
          >
            {loading === 'revoke' ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <UserX className="h-4 w-4 mr-2" />
            )}
            Revocar Acceso
          </Button>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const ContactPortalSection: React.FC<ContactPortalSectionProps> = ({
  contact,
  onGenerateInvitation,
  onResendInvitation,
  onRevokeAccess
}) => {
  return (
    <div className="bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700">
      <div className="px-6 py-4 border-b border-app-dark-700">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-app-gray-400" />
          <h3 className="text-lg font-medium text-app-gray-100">
            Portal Digital
          </h3>
        </div>
      </div>
      
      <div className="px-6 py-6 space-y-6">
        {/* Status */}
        <PortalStatus contact={contact} />

        {/* Metrics */}
        <PortalMetrics contact={contact} />

        {/* Actions */}
        <PortalActions
          contact={contact}
          onGenerateInvitation={onGenerateInvitation}
          onResendInvitation={onResendInvitation}
          onRevokeAccess={onRevokeAccess}
        />

        {/* Information */}
        <div className="pt-4 border-t border-app-dark-700">
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 text-app-gray-400 mt-0.5" />
            <div className="text-xs text-app-gray-500">
              <p className="mb-1">
                <strong>Portal Digital:</strong> Permite a los miembros acceder a su información personal, 
                ver su historial de actividades y gestionar sus preferencias.
              </p>
              <p>
                Las invitaciones son válidas por 7 días. El acceso puede ser revocado en cualquier momento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPortalSection;