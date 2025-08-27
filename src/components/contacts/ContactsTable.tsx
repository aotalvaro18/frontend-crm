// src/components/contacts/ContactsTable.tsx
// ✅ CONTACTS TABLE - VERSIÓN REFACTORIZADA
// Componente de presentación "tonto" que recibe todos los datos y callbacks como props.

import React, { useMemo, useState } from 'react';
import { 
  Mail, Phone, Building2, Calendar, MoreHorizontal, Edit3, Trash2, Eye, Globe, Users, Megaphone, Search, FileText, UserPlus, Presentation, Church, HeartHandshake, Group, Handshake, Upload, Code, Smartphone, Briefcase, ShoppingCart, Hash
} from 'lucide-react';
import { type VariantProps } from 'class-variance-authority';
import { Link } from 'react-router-dom';

// ============================================
// UI COMPONENTS
// ============================================
import { DataTable, type Column } from '@/components/ui/Table';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Dropdown from '@/components/ui/Dropdown';
import { ContactAvatar } from '@/components/ui/Avatar';

// ============================================
// HOOKS (Solo para estado interno de la tabla)
// ============================================
import {
  useBulkOperations,
  useContactOperations,
} from '@/hooks/useContacts';

// ============================================
// TYPES
// ============================================
import type { ContactDTO, ContactStatus, ContactSource } from '@/types/contact.types';
import { CONTACT_STATUS_LABELS, CONTACT_SOURCE_LABELS, getFullName, hasPortalAccess, calculateEngagementLevel } from '@/types/contact.types';

// ============================================
// UTILS
// ============================================
import { cn } from '@/utils/cn';
import { formatters } from '@/utils/formatters';

// ============================================
// COMPONENT PROPS (Ahora es un componente de presentación)
// ============================================
export interface ContactsTableProps {
  contacts: ContactDTO[];
  isLoading: boolean;
  totalContacts: number;
  
  onContactClick: (contact: ContactDTO) => void;
  onContactEdit?: (contact: ContactDTO) => void;
  onContactDelete?: (contact: ContactDTO) => void;
  
  selectedContactIds: Set<number>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  
  pagination: {
    currentPage: number; // 0-based
    totalPages: number;
    onPageChange: (page: number) => void; // Recibe la nueva página 0-based
  };

  className?: string;
  stickyHeader?: boolean;
  mobileView?: 'cards' | 'stack' | 'table';
}

// ============================================
// COMPONENTES INTERNOS
// ============================================
const ContactStatusBadge: React.FC<{ status: ContactStatus; className?: string; }> = ({ status, className }) => {
  const statusInfo = { ACTIVE: { variant: 'active' as const, tooltip: 'Contacto activo en el sistema' }, INACTIVE: { variant: 'inactive' as const, tooltip: 'Contacto inactivo' }, PROSPECT: { variant: 'prospect' as const, tooltip: 'Prospecto potencial' }, LEAD: { variant: 'lead' as const, tooltip: 'Lead cualificado' }, MEMBER: { variant: 'member' as const, tooltip: 'Miembro activo' }, VISITOR: { variant: 'visitor' as const, tooltip: 'Visitante' }, FORMER_MEMBER: { variant: 'former_member' as const, tooltip: 'Ex-miembro' }, DECEASED: { variant: 'deceased' as const, tooltip: 'Fallecido' }, MOVED: { variant: 'moved' as const, tooltip: 'Se mudó' }, DO_NOT_CONTACT: { variant: 'do_not_contact' as const, tooltip: 'No contactar' }, BOUNCED: { variant: 'bounced' as const, tooltip: 'Email/Teléfono rebotado' }, BLOCKED: { variant: 'blocked' as const, tooltip: 'Contacto bloqueado' }};
  const info = statusInfo[status];
  return (<StatusBadge status={info.variant} title={info.tooltip} className={className}>{CONTACT_STATUS_LABELS[status]}</StatusBadge>);
};
const ContactSourceBadge: React.FC<{ source: ContactSource; className?: string; }> = ({ source, className }) => {
  const sourceConfig: Record<ContactSource, { icon: React.ElementType; color: VariantProps<typeof Badge>['variant'] }> = { WEBSITE: { icon: Globe, color: 'info' }, SOCIAL_MEDIA: { icon: Users, color: 'info' }, EMAIL_CAMPAIGN: { icon: Mail, color: 'info' }, ONLINE_AD: { icon: Megaphone, color: 'warning' }, SEO: { icon: Search, color: 'secondary' }, CONTENT_MARKETING: { icon: FileText, color: 'secondary' }, REFERRAL: { icon: UserPlus, color: 'success' }, COLD_CALL: { icon: Phone, color: 'secondary' }, COLD_EMAIL: { icon: Mail, color: 'secondary' }, NETWORKING: { icon: Users, color: 'contact' }, TRADE_SHOW: { icon: Building2, color: 'contact' }, CONFERENCE: { icon: Presentation, color: 'contact' }, CHURCH_SERVICE: { icon: Church, color: 'portal' }, CHURCH_EVENT: { icon: Calendar, color: 'portal' }, SMALL_GROUP: { icon: Users, color: 'portal' }, VOLUNTEER: { icon: HeartHandshake, color: 'success' }, MINISTRY: { icon: Group, color: 'contact' }, PASTORAL_VISIT: { icon: Handshake, color: 'success' }, MANUAL_ENTRY: { icon: Edit3, color: 'secondary' }, IMPORT: { icon: Upload, color: 'info' }, API: { icon: Code, color: 'secondary' }, MOBILE_APP: { icon: Smartphone, color: 'info' }, PARTNER: { icon: Briefcase, color: 'contact' }, VENDOR: { icon: ShoppingCart, color: 'secondary' }, OTHER: { icon: Hash, color: 'secondary' }};
  const config = sourceConfig[source] || sourceConfig.OTHER;
  const IconComponent = config.icon;
  return (<Badge variant={config.color} size="sm" title={CONTACT_SOURCE_LABELS[source]} className={className} icon={<IconComponent />}><span className="hidden sm:inline">{CONTACT_SOURCE_LABELS[source]}</span></Badge>);
};
const EngagementScore: React.FC<{ score: number; className?: string; }> = ({ score, className }) => {
  const level = calculateEngagementLevel(score);
  const levelConfig = { VERY_HIGH: { variant: 'success' as const, label: 'Muy Alto' }, HIGH: { variant: 'info' as const, label: 'Alto' }, MEDIUM: { variant: 'warning' as const, label: 'Medio' }, LOW: { variant: 'secondary' as const, label: 'Bajo' }, VERY_LOW: { variant: 'destructive' as const, label: 'Muy Bajo' }};
  const config = levelConfig[level];
  return (<div className={cn('flex items-center space-x-2', className)}><Badge variant={config.variant} size="sm" title={`Engagement: ${score}/100 (${config.label})`}>{score}</Badge><span className="hidden md:inline text-xs text-app-gray-400">{config.label}</span></div>);
};
const ContactActionsDropdown: React.FC<{ contact: ContactDTO; onView?: () => void; onEdit?: () => void; onDelete?: () => void; isUpdating?: boolean; isDeleting?: boolean; }> = ({ contact, onView, onEdit, onDelete, isUpdating = false, isDeleting = false }) => {
  const items = [{ label: 'Ver detalles', icon: Eye, onClick: onView, disabled: false }, { label: 'Editar', icon: Edit3, onClick: onEdit, disabled: isUpdating || isDeleting }, { type: 'separator' as const }, { label: 'Eliminar', icon: Trash2, onClick: onDelete, disabled: isUpdating || isDeleting, destructive: true }];
  return (<Dropdown trigger={<IconButton variant="ghost" size="icon-sm" disabled={isUpdating || isDeleting} aria-label={`Acciones para ${getFullName(contact)}`}>{(isUpdating || isDeleting) ? (<LoadingSpinner size="xs" />) : (<MoreHorizontal className="h-4 w-4" />)}</IconButton>} items={items} align="end" />);
};

// ============================================
// MAIN COMPONENT
// ============================================
const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts,
  isLoading,
  totalContacts,
  onContactClick,
  onContactEdit,
  onContactDelete,
  selectedContactIds,
  onSelectAll,
  onDeselectAll,
  pagination,
  className,
  stickyHeader = false,
  mobileView = 'cards',
}) => {
  const { updating, deleting } = useContactOperations();
  const { selectContact } = useBulkOperations();
  const [sortColumn, setSortColumn] = useState<string>('lastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnId: string, direction: 'asc' | 'desc' | null) => {
    setSortColumn(direction ? columnId : 'lastName');
    setSortDirection(direction || 'asc');
  };

  const columns: Column<ContactDTO>[] = useMemo(() => [
    { id: 'contact', header: 'Contacto', accessorKey: 'firstName', sortable: true, width: '300px', cell: ({ row }) => ( <div className="flex items-center space-x-3"> <ContactAvatar contact={row} size="sm" /> <div className="min-w-0 flex-1"> <div className="font-medium text-app-gray-100 truncate">{getFullName(row)}</div> {row.email && ( <div className="text-sm text-app-gray-400 truncate flex items-center"> <Mail className="h-3 w-3 mr-1 flex-shrink-0" /> {row.email} </div> )} {row.phone && ( <div className="text-sm text-app-gray-400 truncate flex items-center mt-0.5"> <Phone className="h-3 w-3 mr-1 flex-shrink-0" /> {formatters.phone(row.phone)} </div> )} </div> </div> ), mobileLabel: 'Contacto', },
    { id: 'status', header: 'Estado', accessorKey: 'status', sortable: true, width: '120px', hideOnMobile: true, cell: ({ row }) => ( <ContactStatusBadge status={row.status} /> ), },
    { id: 'source', header: 'Origen', accessorKey: 'source', sortable: true, width: '140px', hideOnMobile: true, cell: ({ row }) => ( <ContactSourceBadge source={row.source} /> ), },
    { id: 'company', header: 'Empresa', accessorKey: 'companyName', sortable: true, width: '160px', hideOnMobile: true, cell: ({ row }) => ( <div className="text-sm text-app-gray-200"> {row.companyName && row.companyId ? ( <Link to={`/companies/${row.companyId}`} className="flex items-center text-primary-400 hover:text-primary-300 hover:underline transition-colors"> <Building2 className="h-3 w-3 mr-1 flex-shrink-0" /> <span className="truncate">{row.companyName}</span> </Link> ) : row.companyId ? ( <Link to={`/companies/${row.companyId}`} className="flex items-center text-primary-400 hover:text-primary-300 hover:underline transition-colors"> <Building2 className="h-3 w-3 mr-1 text-app-gray-400 flex-shrink-0" /> <span className="truncate">Empresa #{row.companyId}</span> </Link> ) : ( <span className="text-app-gray-500 italic">Sin empresa</span> )} </div> ), },
    { id: 'engagement', header: 'Engagement', accessorKey: 'engagementScore', sortable: true, width: '140px', hideOnMobile: true, align: 'center', cell: ({ row }) => ( <EngagementScore score={row.engagementScore} /> ), },
    { id: 'portal', header: 'Portal', accessorKey: 'hasDigitalPortal', sortable: true, width: '100px', hideOnMobile: true, align: 'center', cell: ({ row }) => ( <div className="flex justify-center"> {hasPortalAccess(row) ? ( <Badge variant="success" size="sm" icon={<Globe />}>Activo</Badge> ) : row.hasDigitalPortal ? ( <Badge variant="warning" size="sm" icon={<Globe />}>Pendiente</Badge> ) : ( <Badge variant="secondary" size="sm">Sin acceso</Badge> )} </div> ), },
    { id: 'lastActivity', header: 'Última Actividad', accessorKey: 'lastActivityAt', sortable: true, width: '140px', hideOnMobile: true, cell: ({ row }) => ( <div className="text-sm text-app-gray-400"> {row.lastActivityAt ? ( <div className="flex items-center"> <Calendar className="h-3 w-3 mr-1 flex-shrink-0" /> {formatters.relativeDate(row.lastActivityAt)} </div> ) : ( <span className="italic">Sin actividad</span> )} </div> ), },
  ], []);

  if (isLoading && contacts.length === 0) {
    return (
      <div className={cn('bg-app-dark-800 border border-app-dark-600 rounded-lg', className)}>
        <LoadingSpinner
          size="lg"
          label="Cargando contactos..."
          className="py-12"
        />
      </div>
    );
  }

  if (!isLoading && contacts.length === 0) {
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

  return (
    <div className={cn('bg-app-dark-800 border border-app-dark-600 rounded-lg overflow-hidden', className)}>
      <div className="px-4 py-3 border-b border-app-dark-600 bg-app-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-app-gray-300">
              {selectedContactIds.size > 0 ? (
                <span className="font-medium">
                  {selectedContactIds.size} contacto{selectedContactIds.size !== 1 ? 's' : ''} seleccionado{selectedContactIds.size !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>
                  {totalContacts.toLocaleString()} contacto{totalContacts !== 1 ? 's' : ''} total{totalContacts !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
            {isLoading && (
              <div className="flex items-center space-x-2 text-app-gray-400">
                <LoadingSpinner size="xs" />
                <span className="text-xs">Actualizando...</span>
              </div>
            )}
          </div>
          {selectedContactIds.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeselectAll}
              className="text-app-gray-400 hover:text-white"
            >
              Deseleccionar todo
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={contacts}
        columns={columns}
        enableSelection={true}
        selectedRows={selectedContactIds}
        onRowSelect={(rowId) => selectContact(rowId as number)}
        onSelectAll={contacts.length > 0 && contacts.every(c => selectedContactIds.has(c.id)) ? onDeselectAll : onSelectAll}
        getRowId={(row) => row.id}
        enableSorting={true}
        sortBy={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onRowClick={onContactClick}
        rowActions={(row) => (
          <ContactActionsDropdown
            contact={row}
            onView={() => onContactClick(row)}
            onEdit={() => onContactEdit?.(row)}
            onDelete={() => onContactDelete?.(row)}
            isUpdating={updating.has(row.id)}
            isDeleting={deleting.has(row.id)}
          />
        )}
        variant="default"
        size="md"
        stickyHeader={stickyHeader}
        mobileView={mobileView}
        loading={isLoading}
        loadingRows={5}
        pagination={{
          page: pagination.currentPage, // Pasa la página 0-based directamente
          pageSize: 25, // Asumimos tamaño fijo
          total: totalContacts, // Usa el total real que viene de las props
        }}
        className="border-0"
      />
    </div>
  );
};

export default ContactsTable;