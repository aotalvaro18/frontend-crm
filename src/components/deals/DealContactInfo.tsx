// src/components/deals/DealContactInfo.tsx
// ✅ DEAL CONTACT INFO - Replicando CompanyContactInfo para deals
// Mobile-first + Información de contacto y empresa del deal

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Building, 
  Mail, 
  ExternalLink,
  Calendar
} from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

// ============================================
// TYPES & UTILS
// ============================================
import type { Deal } from '@/types/deal.types';
import { formatters } from '@/utils/formatters';

// ============================================
// TYPES
// ============================================

interface DealContactInfoProps {
  deal: Deal;
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
  verified = false
}) => (
  <div className="flex items-center justify-between p-3 bg-app-dark-700 rounded-lg border border-app-dark-600">
    <div className="flex items-center space-x-3 flex-1 min-w-0">
      <div className="flex-shrink-0 text-app-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-app-gray-300 uppercase tracking-wide">
          {label}
        </p>
        <div className="flex items-center space-x-2">
          {href ? (
            <a 
              href={href}
              className="text-sm text-app-accent-400 hover:text-app-accent-300 transition-colors truncate"
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {value}
            </a>
          ) : (
            <span className="text-sm text-app-gray-100 truncate">{value}</span>
          )}
          {verified && (
            <Badge variant="success" size="sm">Verificado</Badge>
          )}
        </div>
      </div>
    </div>
    
    {(actionLabel && onAction) && (
      <Button
        size="xs"
        variant="ghost"
        onClick={onAction}
        className="flex-shrink-0 ml-2"
      >
        {actionLabel}
      </Button>
    )}
    
    {href && (
      <ExternalLink className="h-3 w-3 text-app-gray-500 flex-shrink-0 ml-2" />
    )}
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

const DealContactInfo: React.FC<DealContactInfoProps> = ({ deal }) => {
    // ============================================
    // COMPUTED VALUES - CORREGIDO
    // ============================================
    const hasContactInfo = !!deal.contactName;
    const hasCompanyInfo = !!deal.companyName;
  
    // ============================================
    // HANDLERS - CORREGIDO Y SIMPLIFICADO
    // ============================================
    // Los handlers para email y teléfono se eliminan ya que no tenemos esos datos.
  
    const handleScheduleMeeting = () => {
      // TODO: Integrar con sistema de calendario
      // Para esto, necesitaríamos el email del contacto, que actualmente no tenemos.
      console.log(`Planificar reunión para el deal: ${deal.title}`);
      console.log(`Necesitarás el email del contacto principal (ID: ${deal.contactId})`);
    };
  
    return (
      <div className="bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-app-dark-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-app-gray-100 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary-400" />
              Información de Relaciones
            </h3>
            
            {/* Quick Actions - CORREGIDO Y SIMPLIFICADO */}
            <div className="flex items-center space-x-2">
              {/* 
                Los botones de Email y Llamar se eliminan porque el DealDTO
                no proporciona 'contactEmail' ni 'contactPhone'.
                Se deja solo el de agendar reunión, que puede abrir un modal
                o navegar a una vista de calendario.
              */}
              
              <Button
                size="sm" // 'xs' no es un tamaño válido en tu Button.tsx
                variant="outline"
                leftIcon={<Calendar className="h-4 w-4" />} // Usa leftIcon
                onClick={handleScheduleMeeting}
              >
                <span className="hidden sm:inline">Agendar Reunión</span>
              </Button>
            </div>
          </div>
        </div>
      
      <div className="px-6 py-6 space-y-6">
        {/* ============================================ */}
        {/* CONTACTO PRINCIPAL */}
        {/* ============================================ */}
        {hasContactInfo ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-app-gray-200 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Contacto Principal
              </h4>
              
              {deal.contactId && (
                <Link
                  to={`/crm/contacts/${deal.contactId}`}
                  className="text-xs text-app-accent-400 hover:text-app-accent-300 transition-colors flex items-center"
                >
                  Ver perfil completo
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              )}
            </div>

            {/* Contact Header */}
            {deal.contactName && (
              <div className="flex items-center space-x-3 p-3 bg-app-dark-700 rounded-lg border border-app-dark-600">
                <Avatar
                  name={deal.contactName}
                  size="md"
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-app-gray-100 truncate">
                    {deal.contactName}
                  </h5>
                  {/* 
                    La propiedad 'contactTitle' no existe en DealDTO.java, 
                    por lo que se elimina esta sección para evitar errores.
                  */}
                </div>
              </div>
            )}

            {/* Contact Methods */}
            <div className="space-y-3">
              {/* 
                La propiedad 'contactEmail' SÍ existe en DealDTO.java, 
                por lo que mantenemos esta sección.
              */}
              {deal.contactEmail && (
                <ContactMethod
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={deal.contactEmail}
                  href={`mailto:${deal.contactEmail}`}
                  actionLabel="Enviar"
                  onAction={() => {
                    // La lógica ahora vive aquí directamente
                    window.location.href = `mailto:${deal.contactEmail}`;
                  }}
                />
              )}

              {/* 
                La propiedad 'contactPhone' NO existe en DealDTO.java, 
                por lo que se elimina esta sección para evitar errores.
              */}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <User className="h-12 w-12 text-app-gray-500 mx-auto mb-3" />
            <h4 className="font-medium text-app-gray-300 mb-2">Sin contacto asignado</h4>
            <p className="text-sm text-app-gray-400 mb-4">
              Esta oportunidad no tiene un contacto principal asignado
            </p>
            <Button size="sm" variant="outline">
              Asignar contacto
            </Button>
          </div>
        )}

        {/* ============================================ */}
        {/* EMPRESA ASOCIADA */}
        {/* ============================================ */}
        {hasCompanyInfo ? (
          <div className="space-y-4 pt-6 border-t border-app-dark-700">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-app-gray-200 flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Empresa Asociada
              </h4>
              
              {deal.companyId && (
                <Link
                  to={`/crm/companies/${deal.companyId}`}
                  className="text-xs text-app-accent-400 hover:text-app-accent-300 transition-colors flex items-center"
                >
                  Ver perfil de la empresa
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              )}
            </div>

            {/* Company Header */}
            {deal.companyName && (
              <div className="flex items-center space-x-3 p-3 bg-app-dark-700 rounded-lg border border-app-dark-600">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-app-gray-100 truncate">
                    {deal.companyName}
                  </h5>
                  {/* 
                    La propiedad 'companyIndustry' no existe en DealDTO.java,
                    por lo que se elimina esta sección para evitar errores.
                    Esta información se podrá ver en la página de detalle de la empresa.
                  */}
                </div>
              </div>
            )}

            {/* 
              Las propiedades 'companyEmail', 'companyPhone' y 'companyWebsite'
              NO existen en DealDTO.java. Se elimina la sección 'Company Contact Methods'
              para evitar errores y mantener el componente alineado con la API.
              Esta información es accesible a través del link "Ver perfil de la empresa".
            */}
          </div>
        ) : deal.contactName && (
          <div className="text-center py-6 pt-6 border-t border-app-dark-700">
            <Building className="h-12 w-12 text-app-gray-500 mx-auto mb-3" />
            <h4 className="font-medium text-app-gray-300 mb-2">Sin empresa asignada</h4>
            <p className="text-sm text-app-gray-400 mb-4">
              Esta oportunidad no está asociada a ninguna empresa.
            </p>
            {/* TODO: Implementar un modal o función para asignar la empresa a este deal */}
            <Button size="sm" variant="outline">
              Asignar empresa
            </Button>
          </div>
        )}

        {/* Propietario de la oportunidad */}
        <div className="pt-6 border-t border-app-dark-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-app-gray-500">
            <div>
              <span className="font-medium">Propietario:</span>
              <br />
              <span className="text-app-gray-300">
                {deal.ownerName || 'No asignado'}
              </span>
            </div>
            <div>
              <span className="font-medium">Última interacción:</span>
              <br />
              <span className="text-app-gray-300">
                {deal.lastActivityAt ? formatters.date(deal.lastActivityAt) : 'Sin interacciones'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealContactInfo;