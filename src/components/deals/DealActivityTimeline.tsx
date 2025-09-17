// src/components/deals/DealActivityTimeline.tsx
// ✅ DEAL ACTIVITY TIMELINE - REESCRITO SIGUIENDO PATRÓN COMPANIES (GOLDEN STANDARD)
// Mobile-first + React Query + Zustand + Componentes reutilizables
// SIN MOCKS - TODO con datos reales del API

import React, { useState, useCallback } from 'react';
import { 
  Clock, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Users, 
  MessageSquare,
  Plus,
  RefreshCw
} from 'lucide-react';

// ============================================
// UI COMPONENTS REUTILIZABLES (Siguiendo arquitectura)
// ============================================
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

// ============================================
// SHARED COMPONENTS (Reutilizando existentes)
// ============================================
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import ActivityFormModal from '@/components/activities/ActivityFormModal';

// ============================================
// HOOKS & SERVICES (Siguiendo slice vertical)
// ============================================
import { 
  useActivitiesByDeal,
  useActivityOperations
} from '@/hooks/useActivities';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useDealById } from '@/hooks/useDeals';

// ============================================
// TYPES & UTILS
// ============================================
import type { ActivityDTO } from '@/types/activity.types';
import { 
  ACTIVITY_TYPE_LABELS, 
  ACTIVITY_TYPE_COLORS,
  isActivityOverdue,
  isActivityCompleted,
  getFormattedDuration
} from '@/types/activity.types';

import { cn } from '@/utils/cn';
import { formatDistance, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================
// COMPONENT PROPS
// ============================================
interface DealActivityTimelineProps {
  dealId: number;
  ownerCognitoSub?: string;
  className?: string;
}

// ============================================
// ACTIVITY ICON COMPONENT (Usando tipos reales)
// ============================================
const ActivityIcon: React.FC<{ type: ActivityDTO['type'] }> = ({ type }) => {
  const iconMap = {
    CALL: Phone,
    EMAIL: Mail,
    MEETING: Calendar,
    NOTE: FileText,
    TASK: Clock,
    STAGE_CHANGE: Users,
    PROPOSAL: FileText,
    CONTRACT: FileText,
    PAYMENT: FileText,
    SUPPORT: MessageSquare,
    OTHER: FileText,
  };

  const Icon = iconMap[type] || FileText;
  const colors = ACTIVITY_TYPE_COLORS[type] || ACTIVITY_TYPE_COLORS.OTHER;

  return (
    <div className={cn(
      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
      colors.bg
    )}>
      <Icon className={cn('h-4 w-4', colors.text)} />
    </div>
  );
};

// ============================================
// ACTIVITY ITEM COMPONENT (Datos reales)
// ============================================
interface ActivityItemProps {
  activity: ActivityDTO;
  isLast: boolean;
  onComplete?: (activityId: number) => void;
  onEdit?: (activity: ActivityDTO) => void;
  onDelete?: (activity: ActivityDTO) => void;
  isCompleting?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ 
  activity, 
  isLast,
  onComplete,
  onEdit,
  onDelete,
  isCompleting = false,
  isUpdating = false,
  isDeleting = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const relativeTime = formatDistance(parseISO(activity.scheduledAt), new Date(), {
    addSuffix: true,
    locale: es
  });

  const hasExpandableContent = activity.description && activity.description.length > 100;
  const isCompleted = isActivityCompleted(activity);
  const isOverdue = isActivityOverdue(activity);
  const isLoading = isCompleting || isUpdating || isDeleting;

  const handleComplete = useCallback(() => {
    if (onComplete && !isCompleted && !isLoading) {
      onComplete(activity.id);
    }
  }, [onComplete, activity.id, isCompleted, isLoading]);

  const handleEdit = useCallback(() => {
    if (onEdit && !isLoading) {
      onEdit(activity);
    }
  }, [onEdit, activity, isLoading]);

  const handleDelete = useCallback(() => {
    if (onDelete && !isLoading) {
      onDelete(activity); // <-- CAMBIO: Pasa el objeto 'activity' completo
    }
  }, [onDelete, activity, isLoading]);

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-8 w-px h-full bg-app-dark-600"></div>
      )}
      
      <div className="flex space-x-3">
        {/* Activity Icon */}
        <ActivityIcon type={activity.type} />
        
        {/* Activity Content */}
        <div className="flex-1 min-w-0 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "text-sm font-medium truncate",
                isCompleted ? "text-app-gray-400 line-through" : "text-app-gray-100"
              )}>
                {activity.subject}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-app-gray-400">
                  {activity.createdByName || 'Usuario'}
                </span>
                <span className="text-xs text-app-gray-500">•</span>
                <span className="text-xs text-app-gray-400">{relativeTime}</span>
                {isOverdue && !isCompleted && (
                  <>
                    <span className="text-xs text-app-gray-500">•</span>
                    <Badge variant="outline" size="sm" className="text-red-400 border-red-500/30">
                      Vencida
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-1 ml-2">
              {!isCompleted && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="text-green-400 hover:text-green-300"
                  title="Marcar como completada"
                >
                  {isCompleting ? (
                    <LoadingSpinner size="xs" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                </Button>
              )}
              
              <Button
                size="xs"
                variant="ghost"
                onClick={handleEdit}
                disabled={isLoading}
                className="text-app-gray-400 hover:text-app-gray-300"
                title="Editar actividad"
              >
                <FileText className="h-3 w-3" />
              </Button>
              
              <Button
                size="xs"
                variant="ghost"
                onClick={handleDelete}
                disabled={isLoading}
                className="text-red-400 hover:text-red-300"
                title="Eliminar actividad"
              >
                {isDeleting ? (
                  <LoadingSpinner size="xs" />
                ) : (
                  <Users className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Basic description */}
          {activity.description && (
            <div className="mt-2">
              <p className={cn(
                "text-sm leading-relaxed",
                isCompleted ? "text-app-gray-500" : "text-app-gray-300"
              )}>
                {hasExpandableContent && !isExpanded
                  ? `${activity.description.substring(0, 100)}...`
                  : activity.description
                }
              </p>
              
              {hasExpandableContent && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-1 text-xs text-primary-400 hover:text-primary-300"
                >
                  {isExpanded ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </div>
          )}

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" size="sm">
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </Badge>
            
            {activity.status && (
              <Badge 
                variant="outline" 
                size="sm"
                className={cn(
                  activity.status === 'COMPLETED' && "text-green-400 border-green-500/30",
                  activity.status === 'PENDING' && "text-yellow-400 border-yellow-500/30",
                  activity.status === 'OVERDUE' && "text-red-400 border-red-500/30"
                )}
              >
                {activity.status === 'COMPLETED' && 'Completada'}
                {activity.status === 'PENDING' && 'Pendiente'}
                {activity.status === 'IN_PROGRESS' && 'En Progreso'}
                {activity.status === 'OVERDUE' && 'Vencida'}
                {activity.status === 'CANCELLED' && 'Cancelada'}
              </Badge>
            )}
            
            {activity.durationMinutes && (
              <Badge variant="outline" size="sm">
                <Clock className="h-2 w-2 mr-1" />
                {getFormattedDuration(activity)}
              </Badge>
            )}
            
            {activity.outcome && (
              <Badge variant="outline" size="sm">
                {activity.outcome === 'SUCCESSFUL' && 'Exitosa'}
                {activity.outcome === 'UNSUCCESSFUL' && 'No exitosa'}
                {activity.outcome === 'NO_RESPONSE' && 'Sin respuesta'}
                {activity.outcome === 'RESCHEDULED' && 'Reagendada'}
                {activity.outcome === 'CANCELLED' && 'Cancelada'}
                {activity.outcome === 'PENDING' && 'Pendiente'}
              </Badge>
            )}
          </div>

          {/* Next steps */}
          {activity.metadata?.nextSteps && (
            <div className="mt-3 p-3 bg-app-dark-700 rounded-lg border border-app-dark-600">
              <h5 className="text-xs font-medium text-app-gray-300 mb-2">Próximos pasos</h5>
              <p className="text-sm text-app-gray-200 leading-relaxed">
                {activity.metadata.nextSteps}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT (Siguiendo patrón Companies)
// ============================================
const DealActivityTimeline: React.FC<DealActivityTimelineProps> = ({ 
  dealId,
  ownerCognitoSub, 
  className 
}) => {
  const { handleError } = useErrorHandler();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<ActivityDTO | null>(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<ActivityDTO | null>(null);

  // ============================================
  // DATA FETCHING CON REACT QUERY (ÚNICA FUENTE DE VERDAD)
  // ============================================
  const { 
    data: activities = [], 
    isLoading, 
    error,
    refetch,
    isFetching
  } = useActivitiesByDeal(dealId);

  const { data: deal } = useDealById(dealId);

  // ============================================
  // OPERACIONES CON ZUSTAND STORE
  // ============================================
  const { 
    completeActivity,
    deleteActivity,
    isCompleting,
    isDeleting,
    isUpdating
  } = useActivityOperations();

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const visibleActivities = showAllActivities 
    ? activities 
    : activities.slice(0, 5);
    
  const hasMoreActivities = activities.length > 5;

  // ============================================
  // HANDLERS
  // ============================================
    const handleAddActivity = useCallback(() => {
        setActivityToEdit(null);
        setIsModalOpen(true);
    }, []);

  const handleCompleteActivity = useCallback(async (activityId: number) => {
    try {
      await completeActivity({
        activityId,
        outcome: 'SUCCESSFUL',
        completionNotes: 'Completada desde timeline'
      });
    } catch (error) {
      handleError(error);
    }
    }, [completeActivity, handleError]);

    const handleEditActivity = useCallback((activity: ActivityDTO) => {
        setActivityToEdit(activity);
        setIsModalOpen(true);
    }, []);

    const handleDeleteActivity = useCallback((activity: ActivityDTO) => {
        setActivityToDelete(activity);
    }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!activityToDelete) return;
    
    try {
      await deleteActivity(activityToDelete.id);
      setActivityToDelete(null);
    } catch (error) {
      handleError(error);
    }
  }, [activityToDelete, deleteActivity, handleError]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ============================================
  // RENDER STATES
  // ============================================
  if (isLoading) {
    return (
      <div className={cn("bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700", className)}>
        <div className="px-4 sm:px-6 py-4 border-b border-app-dark-700">
          <h3 className="text-lg font-medium text-app-gray-100 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary-400" />
            Timeline de Actividades
          </h3>
        </div>
        <div className="px-4 sm:px-6 py-8 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-app-gray-400">Cargando actividades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700", className)}>
        <div className="px-4 sm:px-6 py-4 border-b border-app-dark-700">
          <h3 className="text-lg font-medium text-app-gray-100 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary-400" />
            Timeline de Actividades
          </h3>
        </div>
        <div className="px-4 sm:px-6 py-8">
          <EmptyState
            icon={Clock}
            title="Error al cargar actividades"
            description="No se pudieron cargar las actividades de esta oportunidad"
            action={
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                Reintentar
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700", className)}>
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-app-dark-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-app-gray-100 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary-400" />
              Timeline de Actividades
              <span className="ml-2 text-sm text-app-gray-400">
                ({activities.length})
              </span>
            </h3>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={isFetching}
                className="p-2"
              >
                {isFetching ? (
                  <LoadingSpinner size="xs" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                size="sm"
                icon={Plus}
                onClick={handleAddActivity}
              >
                <span className="hidden sm:inline">Nueva Actividad</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="px-4 sm:px-6 py-6">
          {visibleActivities.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Sin actividades registradas"
              description="No hay actividades registradas para esta oportunidad aún"
              action={
                <Button size="sm" icon={Plus} onClick={handleAddActivity}>
                  Agregar primera actividad
                </Button>
              }
            />
          ) : (
            <div className="space-y-0">
              {visibleActivities.map((activity, index) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  isLast={index === visibleActivities.length - 1 && !hasMoreActivities}
                  onComplete={handleCompleteActivity}
                  onEdit={handleEditActivity}
                  onDelete={handleDeleteActivity}
                  isCompleting={isCompleting(activity.id)}
                  isUpdating={isUpdating(activity.id)}
                  isDeleting={isDeleting(activity.id)}
                />
              ))}
              
              {/* Show More Button */}
              {hasMoreActivities && (
                <div className="pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllActivities(!showAllActivities)}
                    className="w-full"
                  >
                    {showAllActivities 
                      ? 'Mostrar menos' 
                      : `Ver ${activities.length - 5} actividades más`
                    }
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!activityToDelete}
        onClose={() => setActivityToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar actividad"
        description={`¿Estás seguro que quieres eliminar la actividad "${activityToDelete?.subject}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        isConfirming={activityToDelete ? isDeleting(activityToDelete.id) : false}
      />

        <ActivityFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
        contactId={deal?.contactId!} // <-- Usamos el contactId del Deal. El '!' es seguro aquí.*
        dealId={dealId}
        activityToEdit={activityToEdit}
        />
    </>
  );
};

export default DealActivityTimeline;