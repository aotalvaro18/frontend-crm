// src/components/deals/DealBasicInfo.tsx
// ✅ DEAL BASIC INFO - Replicando CompanyBasicInfo para deals
// Mobile-first + Información básica del deal

import React from 'react';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Flag,
  FileText
} from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================
import { Badge } from '@/components/ui/Badge';

// ============================================
// TYPES & UTILS
// ============================================
import type { Deal } from '@/types/deal.types';
import { 
  getStatusVariant,
  getPriorityVariant,
  DEAL_STATUS_LABELS,
  DEAL_PRIORITY_LABELS,
  DEAL_TYPE_LABELS
} from '@/types/deal.types';
import { formatters } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { formatDistance, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================
// TYPES
// ============================================

interface DealBasicInfoProps {
  deal: Deal;
}

// ============================================
// MAIN COMPONENT
// ============================================

const DealBasicInfo: React.FC<DealBasicInfoProps> = ({ deal }) => {
const statusVariant = getStatusVariant(deal.status);
const priorityVariant = getPriorityVariant(deal.priority);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const expectedCloseFormatted = deal.expectedCloseDate 
    ? formatDistance(parseISO(deal.expectedCloseDate), new Date(), { 
        addSuffix: true, 
        locale: es 
      })
    : null;

  const isOverdue = deal.expectedCloseDate 
    ? new Date(deal.expectedCloseDate) < new Date() && deal.status === 'OPEN'
    : false;

  const createdDateFormatted = deal.createdAt 
    ? formatters.dateTime(deal.createdAt)
    : null;

  const updatedDateFormatted = deal.updatedAt 
    ? formatters.dateTime(deal.updatedAt)
    : null;

  return (
    <div className="bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-app-dark-700">
        <h3 className="text-lg font-medium text-app-gray-100 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary-400" />
          Información Básica
        </h3>
      </div>
      
      <div className="px-6 py-6">
        {/* Grid de información básica */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Estado */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-app-gray-300">Estado</label>
            <div>
              <Badge variant={statusVariant} size="sm"> 
                {DEAL_STATUS_LABELS[deal.status]}
              </Badge>
            </div>
          </div>

          {/* Prioridad */}
          {deal.priority && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-app-gray-300">Prioridad</label>
              <div>
                <Badge variant={priorityVariant} size="sm"> 
                  <Flag className="h-3 w-3 mr-1" />
                  {DEAL_PRIORITY_LABELS[deal.priority]}
                </Badge>
              </div>
            </div>
          )}

          {/* Tipo de oportunidad */}
          {deal.type && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-app-gray-300">Tipo</label>
              <div>
                <Badge variant="outline" size="sm">
                  {DEAL_TYPE_LABELS[deal.type]}
                </Badge>
              </div>
            </div>
          )}

          {/* Probabilidad */}
          {deal.probability && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-app-gray-300">Probabilidad</label>
              <div className="flex items-center space-x-2">
                <TrendingUp className={cn(
                  "h-4 w-4",
                  deal.probability >= 70 ? "text-green-400" :
                  deal.probability >= 40 ? "text-yellow-400" : "text-red-400"
                )} />
                <span className="text-sm text-app-gray-100">{deal.probability}%</span>
              </div>
            </div>
          )}

          {/* Fecha esperada de cierre */}
          {deal.expectedCloseDate && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-app-gray-300">Fecha esperada de cierre</label>
              <div className="flex items-center space-x-2">
                <Calendar className={cn(
                  "h-4 w-4",
                  isOverdue ? "text-red-400" : "text-app-gray-400"
                )} />
                <div className="flex flex-col">
                  <span className={cn(
                    "text-sm",
                    isOverdue ? "text-red-400" : "text-app-gray-100"
                  )}>
                    {formatters.date(deal.expectedCloseDate)}
                  </span>
                  {expectedCloseFormatted && (
                    <span className={cn(
                      "text-xs",
                      isOverdue ? "text-red-400" : "text-app-gray-400"
                    )}>
                      {expectedCloseFormatted}
                    </span>
                  )}
                </div>
                {isOverdue && (
                  <Badge variant="destructive" size="sm">
                    <AlertCircle className="h-2 w-2 mr-1" />
                    Vencida
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Días en etapa actual */}
          {deal.daysInCurrentStage && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-app-gray-300">Tiempo en etapa actual</label>
              <div className="flex items-center space-x-2">
                <Clock className={cn(
                  "h-4 w-4",
                  deal.daysInCurrentStage > 30 ? "text-yellow-400" : "text-app-gray-400"
                )} />
                <span className="text-sm text-app-gray-100">
                  {deal.daysInCurrentStage} días
                </span>
                {deal.daysInCurrentStage > 30 && (
                  <Badge variant="warning" size="sm">
                    Estancada
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Descripción */}
        {deal.description && (
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-app-gray-300">Descripción</label>
            <div className="p-3 bg-app-dark-700 rounded-lg border border-app-dark-600">
              <p className="text-sm text-app-gray-100 leading-relaxed whitespace-pre-wrap">
                {deal.description}
              </p>
            </div>
          </div>
        )}

        {/* Fuente */}
        {deal.source && (
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-app-gray-300">Fuente</label>
            <p className="text-sm text-app-gray-100">{deal.source}</p>
            {deal.sourceDetails && (
              <p className="text-xs text-app-gray-400">{deal.sourceDetails}</p>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="mt-6 pt-6 border-t border-app-dark-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-app-gray-500">
            <div>
              <span className="font-medium">Creada:</span>
              <br />
              <span className="text-app-gray-300">
                {createdDateFormatted || 'Fecha no disponible'}
              </span>
            </div>
            <div>
              <span className="font-medium">Última actualización:</span>
              <br />
              <span className="text-app-gray-300">
                {updatedDateFormatted || 'Fecha no disponible'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealBasicInfo;