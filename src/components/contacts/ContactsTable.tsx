// src/components/contacts/ContactsTable.tsx
// ✅ CONTACTS TABLE - INTEGRACIÓN FASE 2 COMPLETA
// Smart component que usa hooks internamente + Mobile-first + Enterprise-grade

import React, { useMemo, useState } from 'react';
import { 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  MoreHorizontal,
  Edit3,
  Trash2,
  Eye,
  Globe,
  Users,
  Megaphone,
  Search,
  FileText,
  UserPlus,
  Presentation,
  Church,
  HeartHandshake,
  Group,
  Handshake,
  Upload,
  Code,
  Smartphone,
  Briefcase,
  ShoppingCart,
  Hash
} from 'lucide-react';

import { type VariantProps } from 'class-variance-authority';

// ============================================
// UI COMPONENTS FASE 2 INTEGRADOS
// ============================================

import { DataTable, type Column } from '@/components/ui/Table';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
//import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Dropdown from '@/components/ui/Dropdown';
import { ContactAvatar } from '@/components/ui/Avatar';

// ============================================
// HOOKS FASE 2 INTEGRADOS
// ============================================

import {
  useContacts,
  useBulkOperations,
  useOperationStates,
  useConnectionStatus
} from '@/hooks/useContacts';

//import usePagination from '@/hooks/usePagination';

// ============================================
// TYPES FASE 2 INTEGRADOS
// ============================================

import type { 
  ContactDTO, 
  ContactStatus,
  ContactSource 
} from '@/types/contact.types';

import { 
  CONTACT_STATUS_LABELS,
  CONTACT_SOURCE_LABELS,
  getFullName,
  hasPortalAccess,
  calculateEngagementLevel
} from '@/types/contact.types';

// ============================================
// UTILS
// ============================================

import { cn } from '@/utils/cn';
import { formatters } from '@/utils/formatters';

// ============================================
// COMPONENT PROPS
// ============================================

export interface ContactsTableProps {
  // Action props (solo estas props vienen de ContactListPage)
  contacts: ContactDTO[];
  onContactClick?: (contact: ContactDTO) => void;
  onContactEdit?: (contact: ContactDTO) => void;
  onContactDelete?: (contact: ContactDTO) => void;
  
  // Pagination props (conecta con estado de ContactListPage)
  currentPage?: number;
  onPageChange?: (page: number) => void;
  
  // Optional overrides (para casos especiales)
  className?: string;
  stickyHeader?: boolean;
  mobileView?: 'cards' | 'stack' | 'table';
}

// ============================================
// SPECIALIZED COMPONENTS
// ============================================

/**
 * Contact Status Badge con tooltips informativos
 */
const ContactStatusBadge: React.FC<{ 
  status: ContactStatus;
  className?: string;
}> = ({ status, className }) => {
  const statusInfo = {
    ACTIVE: { variant: 'active' as const, tooltip: 'Contacto activo en el sistema' },
    INACTIVE: { variant: 'inactive' as const, tooltip: 'Contacto inactivo' },
    PROSPECT: { variant: 'prospect' as const, tooltip: 'Prospecto potencial' },
    LEAD: { variant: 'lead' as const, tooltip: 'Lead cualificado' },
    MEMBER: { variant: 'member' as const, tooltip: 'Miembro activo' },
    VISITOR: { variant: 'visitor' as const, tooltip: 'Visitante' },
    FORMER_MEMBER: { variant: 'former_member' as const, tooltip: 'Ex-miembro' },
    DECEASED: { variant: 'deceased' as const, tooltip: 'Fallecido' },
    MOVED: { variant: 'moved' as const, tooltip: 'Se mudó' },
    DO_NOT_CONTACT: { variant: 'do_not_contact' as const, tooltip: 'No contactar' },
    BOUNCED: { variant: 'bounced' as const, tooltip: 'Email/Teléfono rebotado' },
    BLOCKED: { variant: 'blocked' as const, tooltip: 'Contacto bloqueado' },
  };

  const info = statusInfo[status];
  
  return (
    <StatusBadge
      status={info.variant}
      title={info.tooltip}
      className={className}
    >
      {CONTACT_STATUS_LABELS[status]}
    </StatusBadge>
  );
};

/**
 * Contact Source Badge
 */
const ContactSourceBadge: React.FC<{ 
  source: ContactSource;
  className?: string;
}> = ({ source, className }) => {
  // ✅ CORRECCIÓN: Objeto de configuración completo.
  // Mapea cada ContactSource a un icono.
  const sourceConfig: Record<ContactSource, { icon: React.ElementType;
      color: VariantProps<typeof Badge>['variant'] }> = {
      WEBSITE: { icon: Globe, color: 'info' },
      SOCIAL_MEDIA: { icon: Users, color: 'info' },
      EMAIL_CAMPAIGN: { icon: Mail, color: 'info' },
      ONLINE_AD: { icon: Megaphone, color: 'warning' },
      SEO: { icon: Search, color: 'secondary' },
      CONTENT_MARKETING: { icon: FileText, color: 'secondary' },
      REFERRAL: { icon: UserPlus, color: 'success' },
      COLD_CALL: { icon: Phone, color: 'secondary' },
      COLD_EMAIL: { icon: Mail, color: 'secondary' },
      NETWORKING: { icon: Users, color: 'contact' },
      TRADE_SHOW: { icon: Building2, color: 'contact' },
      CONFERENCE: { icon: Presentation, color: 'contact' },
      CHURCH_SERVICE: { icon: Church, color: 'portal' },
      CHURCH_EVENT: { icon: Calendar, color: 'portal' },
      SMALL_GROUP: { icon: Users, color: 'portal' },
      VOLUNTEER: { icon: HeartHandshake, color: 'success' },
      MINISTRY: { icon: Group, color: 'contact' },
      PASTORAL_VISIT: { icon: Handshake, color: 'success' },
      MANUAL_ENTRY: { icon: Edit3, color: 'secondary' },
      IMPORT: { icon: Upload, color: 'info' },
      API: { icon: Code, color: 'secondary' },
      MOBILE_APP: { icon: Smartphone, color: 'info' },
      PARTNER: { icon: Briefcase, color: 'contact' },
      VENDOR: { icon: ShoppingCart, color: 'secondary' },
      OTHER: { icon: Hash, color: 'secondary' },
  };

  const config = sourceConfig[source] || sourceConfig.OTHER;
  const IconComponent = config.icon;

  return (
    <Badge
      variant={config.color}
      size="sm"
      title={CONTACT_SOURCE_LABELS[source]}
      className={className}
      icon={<IconComponent />}
    >
      <span className="hidden sm:inline">
        {CONTACT_SOURCE_LABELS[source]}
      </span>
    </Badge>
  );
};

/**
 * Engagement Score Display
 */
const EngagementScore: React.FC<{ 
  score: number;
  className?: string;
}> = ({ score, className }) => {
  const level = calculateEngagementLevel(score);
  
  const levelConfig = {
    VERY_HIGH: { variant: 'success' as const, label: 'Muy Alto' },
    HIGH: { variant: 'info' as const, label: 'Alto' },
    MEDIUM: { variant: 'warning' as const, label: 'Medio' },
    LOW: { variant: 'secondary' as const, label: 'Bajo' },
    VERY_LOW: { variant: 'destructive' as const, label: 'Muy Bajo' },
  };

  const config = levelConfig[level];

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Badge
        variant={config.variant}
        size="sm"
        title={`Engagement: ${score}/100 (${config.label})`}
      >
        {score}
      </Badge>
      <span className="hidden md:inline text-xs text-app-gray-400">
        {config.label}
      </span>
    </div>
  );
};

/**
 * Contact Avatar con estado online/portal
 */


/**
 * Contact Actions Dropdown
 */
const ContactActionsDropdown: React.FC<{
  contact: ContactDTO;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}> = ({ 
  contact, 
  onView, 
  onEdit, 
  onDelete, 
  isUpdating = false, 
  isDeleting = false 
}) => {
  const items = [
    {
      label: 'Ver detalles',
      icon: Eye,
      onClick: onView,
      disabled: false,
    },
    {
      label: 'Editar',
      icon: Edit3,
      onClick: onEdit,
      disabled: isUpdating || isDeleting,
    },
    {
      type: 'separator' as const,
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      onClick: onDelete,
      disabled: isUpdating || isDeleting,
      destructive: true,
    },
  ];

  return (
    <Dropdown
      trigger={
        <IconButton
          variant="ghost"
          size="icon-sm"
          disabled={isUpdating || isDeleting}
          aria-label={`Acciones para ${getFullName(contact)}`}
        >
          {(isUpdating || isDeleting) ? (
            <LoadingSpinner size="xs" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </IconButton>
      }
      items={items}
      align="end"
    />
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts,
  onContactClick,
  onContactEdit,
  onContactDelete,
  currentPage = 0,
  className,
  stickyHeader = false,
  mobileView = 'cards',
}) => {
  // ============================================
  // HOOKS - SMART COMPONENT
  // ============================================

  // Core contact data (desde el store)
  const {
    loading,
    error,
    totalContacts
  } = useContacts();

  // Bulk operations
  const {
    selectedContactIds,
    hasSelection,
    selectContact,
    selectAllContacts,
    deselectAllContacts
  } = useBulkOperations();

  // Operation states
  const { updating, deleting } = useOperationStates();

  // Connection status
  const { isOnline } = useConnectionStatus();

  // ============================================
  // LOCAL STATE
  // ============================================

  const [sortColumn, setSortColumn] = useState<string>('lastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ============================================
  // HANDLERS
  // ============================================

  const handleSort = (columnId: string, direction: 'asc' | 'desc' | null) => {
    if (direction === null) {
      setSortColumn('lastName');
      setSortDirection('asc');
    } else {
      setSortColumn(columnId);
      setSortDirection(direction);
    }
  };

  const handleRowClick = (contact: ContactDTO) => {
    onContactClick?.(contact);
  };

  const handleContactEdit = (contact: ContactDTO) => {
    onContactEdit?.(contact);
  };

  const handleContactDelete = (contact: ContactDTO) => {
    onContactDelete?.(contact);
  };

  // ============================================
  // SELECTION HELPERS
  // ============================================

  const allSelected = contacts.length > 0 && contacts.every(contact => 
    selectedContactIds.has(contact.id)
  );
  
  const handleSelectAll = () => {
    if (allSelected) {
      deselectAllContacts();
    } else {
      selectAllContacts();
    }
  };

  // ============================================
  // TABLE COLUMNS DEFINITION
  // ============================================

  const columns: Column<ContactDTO>[] = useMemo(() => [
    // Contact info (principal)
    {
      id: 'contact',
      header: 'Contacto',
      accessorKey: 'firstName',
      sortable: true,
      width: '300px',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <ContactAvatar contact={row} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-app-gray-100 truncate">
              {getFullName(row)}
            </div>
            {row.email && (
              <div className="text-sm text-app-gray-400 truncate flex items-center">
                <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                {row.email}
              </div>
            )}
            {row.phone && (
              <div className="text-sm text-app-gray-400 truncate flex items-center mt-0.5">
                <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                {formatters.phone(row.phone)}
              </div>
            )}
          </div>
        </div>
      ),
      mobileLabel: 'Contacto',
    },

    // Status
    {
      id: 'status',
      header: 'Estado',
      accessorKey: 'status',
      sortable: true,
      width: '120px',
      hideOnMobile: true,
      cell: ({ row }) => (
        <ContactStatusBadge status={row.status} />
      ),
    },

    // Source
    {
      id: 'source',
      header: 'Origen',
      accessorKey: 'source',
      sortable: true,
      width: '140px',
      hideOnMobile: true,
      cell: ({ row }) => (
        <ContactSourceBadge source={row.source} />
      ),
    },

    // Company
    {
      id: 'company',
      header: 'Empresa',
      accessorKey: 'companyName',
      sortable: true,
      width: '160px',
      hideOnMobile: true,
      cell: ({ row }) => (
        <div className="text-sm text-app-gray-200">
          {row.companyName ? (
            <div className="flex items-center">
              <Building2 className="h-3 w-3 mr-1 text-app-gray-400 flex-shrink-0" />
              <span className="truncate">{row.companyName}</span>
            </div>
          ) : (
            <span className="text-app-gray-500 italic">Sin empresa</span>
          )}
        </div>
      ),
    },

    // Engagement
    {
      id: 'engagement',
      header: 'Engagement',
      accessorKey: 'engagementScore',
      sortable: true,
      width: '140px',
      hideOnMobile: true,
      align: 'center',
      cell: ({ row }) => (
        <EngagementScore score={row.engagementScore} />
      ),
    },

    // Portal Access
    {
      id: 'portal',
      header: 'Portal',
      accessorKey: 'hasDigitalPortal',
      sortable: true,
      width: '100px',
      hideOnMobile: true,
      align: 'center',
      cell: ({ row }) => (
        <div className="flex justify-center">
          {hasPortalAccess(row) ? (
            <Badge variant="success" size="sm" icon={<Globe />}>
              Activo
            </Badge>
          ) : row.hasDigitalPortal ? (
            <Badge variant="warning" size="sm" icon={<Globe />}>
              Pendiente
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm">
              Sin acceso
            </Badge>
          )}
        </div>
      ),
    },

    // Last activity
    {
      id: 'lastActivity',
      header: 'Última Actividad',
      accessorKey: 'lastActivityAt',
      sortable: true,
      width: '140px',
      hideOnMobile: true,
      cell: ({ row }) => (
        <div className="text-sm text-app-gray-400">
          {row.lastActivityAt ? (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
              {formatters.relativeDate(row.lastActivityAt)}
            </div>
          ) : (
            <span className="italic">Sin actividad</span>
          )}
        </div>
      ),
    },
  ], []);

  // ============================================
  // RENDER HELPERS
  // ============================================

  // Loading state
  if (loading && contacts.length === 0) {
    return (
      <div className={cn('bg-app-dark-800 border border-app-dark-600 rounded-lg', className)}>
        <LoadingSpinner
          size="lg"
          label="Cargando contactos..."
          srOnly={false} // Para que el label sea visible
          className="py-12" // El centrado se maneja en el div padre, que ya tiene flex y justify-center
        />
      </div>
    );
  }

  // Error state
  if (error && contacts.length === 0) {
    return (
      <div className={cn('bg-app-dark-800 border border-app-dark-600 rounded-lg', className)}>
        <EmptyState
          preset="loading-failed" // ✅ CORRECCIÓN: Usar el preset 'loading-failed'
          description={error}    // Sobrescribimos la descripción por defecto con el error real
          variant="card"
          size="lg"
        />
      </div>
    );
  }

  // Empty state
  if (!loading && contacts.length === 0) {
    return (
      <div className={cn('bg-app-dark-800 border border-app-dark-600 rounded-lg', className)}>
        <EmptyState
          preset="no-contacts"
          variant="card"
          size="lg"
        />
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className={cn('bg-app-dark-800 border border-app-dark-600 rounded-lg overflow-hidden', className)}>
      {/* Table Header - Info y estado */}
      <div className="px-4 py-3 border-b border-app-dark-600 bg-app-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-app-gray-300">
              {hasSelection ? (
                <span className="font-medium">
                  {selectedContactIds.size} contacto{selectedContactIds.size !== 1 ? 's' : ''} seleccionado{selectedContactIds.size !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>
                  {totalContacts.toLocaleString()} contacto{totalContacts !== 1 ? 's' : ''} total{totalContacts !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
            
            {/* Connection status */}
            {!isOnline && (
              <Badge variant="warning" size="sm">
                Sin conexión
              </Badge>
            )}
            
            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center space-x-2 text-app-gray-400">
                <LoadingSpinner size="xs" />
                <span className="text-xs">Actualizando...</span>
              </div>
            )}
          </div>

          {/* Bulk actions info */}
          {hasSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={deselectAllContacts}
              className="text-app-gray-400 hover:text-white"
            >
              Deseleccionar todo
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={contacts}
        columns={columns}
        enableSelection={true}
        selectedRows={selectedContactIds}
        onRowSelect={(rowId) => selectContact(rowId as number)}
        onSelectAll={handleSelectAll}
        getRowId={(row) => row.id}
        enableSorting={true}
        sortBy={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onRowClick={handleRowClick}
        rowActions={(row) => (
          <ContactActionsDropdown
            contact={row}
            onView={() => handleRowClick(row)}
            onEdit={() => handleContactEdit(row)}
            onDelete={() => handleContactDelete(row)}
            isUpdating={updating.has(row.id)}
            isDeleting={deleting.has(row.id)}
          />
        )}
        variant="default"
        size="md"
        stickyHeader={stickyHeader}
        mobileView={mobileView}
        loading={loading}
        loadingRows={5}
        pagination={{
          page: currentPage,
          pageSize: 25,
          total: totalContacts,
        }}
        className="border-0" // Sin border porque ya lo tiene el contenedor
      />
    </div>
  );
};

export default ContactsTable;