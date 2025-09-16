// src/components/companies/CompanyActivityTimeline.tsx
// ✅ COMPANY ACTIVITY TIMELINE - REFACTORIZADO A "TALLA MUNDIAL"
// Sigue el "Golden Standard" de DealActivityTimeline.
// Autónomo, usa datos reales, tipos centralizados y hooks.

import React, { useState, useCallback } from 'react';
import { 
  Clock, Phone, Mail, Calendar, FileText, Users, MessageSquare, Plus, RefreshCw, ChevronDown, ChevronUp, Edit3, Trash2, CheckCircle
} from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

// ============================================
// HOOKS & SERVICES
// ============================================
import { useActivitiesByCompany, useActivityOperations } from '@/hooks/useActivities';
import { useErrorHandler } from '@/hooks/useErrorHandler';

// ============================================
// TYPES & UTILS
// ============================================
import type { ActivityDTO, ActivityType } from '@/types/activity.types';
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_COLORS, isActivityCompleted, getFormattedDuration } from '@/types/activity.types';
import { cn } from '@/utils/cn';
import { formatDistance, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ActivityFormModal from '@/components/activities/ActivityFormModal';

// ============================================
// COMPONENT PROPS
// ============================================
interface CompanyActivityTimelineProps {
  companyId: number;
  className?: string;
}

// ============================================
// SUB-COMPONENTES INTERNOS (Reutilizados de los otros timelines)
// ============================================

const ActivityIcon: React.FC<{ type: ActivityType }> = ({ type }) => {
  // ... (Esta lógica es idéntica, puedes incluso moverla a un archivo shared si quieres)
  const iconMap: Record<ActivityType, React.ElementType> = {
    CALL: Phone, EMAIL: Mail, MEETING: Calendar, NOTE: FileText, TASK: Clock,
    STAGE_CHANGE: Users, PROPOSAL: FileText, CONTRACT: FileText,
    PAYMENT: FileText, SUPPORT: MessageSquare, OTHER: FileText,
  };
  const Icon = iconMap[type] || FileText;
  const colors = ACTIVITY_TYPE_COLORS[type] || ACTIVITY_TYPE_COLORS.OTHER;
  return (
    <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', colors.bg)}>
      <Icon className={cn('h-4 w-4', colors.text)} />
    </div>
  );
};

interface ActivityItemComponentProps {
  activity: ActivityDTO;
  isLast: boolean;
  onComplete: (activityId: number) => void;
  onEdit: (activity: ActivityDTO) => void;
  onDelete: (activity: ActivityDTO) => void;
  isCompleting: boolean;
  isDeleting: boolean;
}

const ActivityItemComponent: React.FC<ActivityItemComponentProps> = ({ activity, isLast, onComplete, onEdit, onDelete, isCompleting, isDeleting }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const relativeTime = formatDistance(parseISO(activity.scheduledAt), new Date(), {
    addSuffix: true,
    locale: es
  });
  const hasExpandableContent = activity.description && activity.description.length > 100;
  const completed = isActivityCompleted(activity);
  const isLoading = isCompleting || isDeleting;

  return (
    <div className="relative pl-11">
      {!isLast && <div className="absolute left-4 top-5 h-full w-px bg-app-dark-600" />}
      <div className="absolute left-0 top-1">
        <ActivityIcon type={activity.type} />
      </div>
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className={cn("text-sm font-medium", completed ? "text-app-gray-400 line-through" : "text-app-gray-100")}>
            {activity.subject}
            </h4>
            <div className="flex items-center space-x-2 mt-1 text-xs text-app-gray-400">
              <span>{activity.createdByName || 'Usuario'}</span>
              <span>•</span>
              <span>{relativeTime}</span>
              {activity.isOverdue && !completed && <Badge variant="destructive" size="sm">Vencida</Badge>}
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            {!completed && onComplete && (
              <Button size="sm" variant="ghost" onClick={() => onComplete(activity.id)} disabled={isLoading} title="Completar">
                {isCompleting ? <LoadingSpinner size="xs" /> : <CheckCircle className="h-4 w-4 text-green-400" />}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onEdit(activity)} disabled={isLoading} title="Editar">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(activity)} disabled={isLoading} title="Eliminar">
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        </div>
        {activity.description && (
          <div className="mt-2 text-sm text-app-gray-300">
            <p className={cn(hasExpandableContent && !isExpanded && "line-clamp-2")}>
              {activity.description}
            </p>
            {hasExpandableContent && (
              <button onClick={() => setIsExpanded(!isExpanded)} className="mt-1 text-xs text-primary-400 hover:underline">
                {isExpanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT - Lógica adaptada para Companies
// ============================================
const CompanyActivityTimeline: React.FC<CompanyActivityTimelineProps> = ({ companyId, className }) => {
  const { handleError } = useErrorHandler();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<ActivityDTO | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<ActivityDTO | null>(null);

  // ✅ CAMBIO CLAVE: Usar el hook específico para Companies
  const { data: activities = [], isLoading, error, refetch, isFetching } = useActivitiesByCompany(companyId);
  
  const { completeActivity, deleteActivity, isCompleting, isDeleting } = useActivityOperations();

  // Los handlers son idénticos, solo cambia el contexto del 'console.log'
  const handleAddActivity = useCallback(() => {
    setActivityToEdit(null); // No hay actividad para editar
    // ✅ El contactId NO se pre-selecciona. El usuario lo elegirá en el formulario.
    setIsModalOpen(true);
  }, []);
  const handleEditActivity = useCallback((activity: ActivityDTO) => {
    setActivityToEdit(activity);
    setIsModalOpen(true);
  }, []);
  
  const handleCompleteActivity = useCallback(async (activityId: number) => {
    try {
      await completeActivity({ activityId, outcome: 'SUCCESSFUL' });
    } catch (e) { handleError(e) }
  }, [completeActivity, handleError]);

  const handleConfirmDelete = useCallback(async () => {
    if (!activityToDelete) return;
    try {
      await deleteActivity(activityToDelete.id, () => setActivityToDelete(null));
    } catch (e) { handleError(e) }
  }, [activityToDelete, deleteActivity, handleError]);

  const visibleActivities = showAll ? activities : activities.slice(0, 5);
  const hasMoreActivities = activities.length > 5;

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>;
    if (error) return <EmptyState icon={Clock} title="Error al cargar" description="No se pudieron cargar las actividades." action={<Button size="sm" variant="outline" onClick={() => refetch()}>Reintentar</Button>} />;
    if (activities.length === 0) return <EmptyState icon={MessageSquare} title="Sin actividades" description="No hay actividades registradas para esta empresa." action={<Button size="sm" onClick={handleAddActivity}>Agregar primera actividad</Button>} />;

    return (
      <>
        <div className="space-y-0">
          {visibleActivities.map((activity, index) => (
            <ActivityItemComponent
              key={activity.id}
              activity={activity}
              isLast={index === visibleActivities.length - 1 && !hasMoreActivities}
              onComplete={handleCompleteActivity}
              onEdit={handleEditActivity}
              onDelete={setActivityToDelete}
              isCompleting={isCompleting(activity.id)}
              isDeleting={isDeleting(activity.id)}
            />
          ))}
        </div>
        {hasMoreActivities && (
          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>
              {showAll ? <><ChevronUp className="h-4 w-4 mr-1" />Mostrar menos</> : <><ChevronDown className="h-4 w-4 mr-1" />Ver todas ({activities.length})</>}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className={cn("bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700", className)}>
        <div className="px-6 py-4 border-b border-app-dark-700 flex items-center justify-between">
          <h3 className="text-lg font-medium text-app-gray-100 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary-400" />
            Actividades <span className="ml-2 text-sm text-app-gray-400">({activities.length})</span>
          </h3>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching} className="p-2">
              {isFetching ? <LoadingSpinner size="xs" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAddActivity}>Añadir</Button>
          </div>
        </div>
        <div className="px-6 py-6">
          {renderContent()}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!activityToDelete}
        onClose={() => setActivityToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Actividad"
        description={`¿Estás seguro que quieres eliminar la actividad "${activityToDelete?.subject}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        isConfirming={activityToDelete ? isDeleting(activityToDelete.id) : false}
        variant="destructive"
      />

        <ActivityFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
        // contactId no se pasa, o se pasa como undefined
        companyId={companyId}
        activityToEdit={activityToEdit}
        />
    </>
  );
};

export default CompanyActivityTimeline;