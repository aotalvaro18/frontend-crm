// src/components/contacts/ContactActivityTimeline.tsx
// Activity timeline component especializado para el detalle de contacto

import React, { useState, useEffect } from 'react';
import { 
  Activity, Mail, Phone, Calendar, FileText, User, 
  MessageSquare, Globe, Plus, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/utils/formatters';

// ============================================
// TYPES
// ============================================

interface ActivityItem {
  id: number;
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'NOTE' | 'TASK' | 'PORTAL_ACCESS' | 'CREATED' | 'UPDATED';
  title: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  metadata?: Record<string, any>;
}

interface ContactActivityTimelineProps {
  contactId: number;
}

// ============================================
// ACTIVITY ICON COMPONENT
// ============================================

const ActivityIcon: React.FC<{ type: ActivityItem['type'] }> = ({ type }) => {
  const iconMap = {
    EMAIL: { icon: Mail, color: 'text-blue-400', bg: 'bg-blue-900/20' },
    CALL: { icon: Phone, color: 'text-green-400', bg: 'bg-green-900/20' },
    MEETING: { icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-900/20' },
    NOTE: { icon: FileText, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
    TASK: { icon: Activity, color: 'text-orange-400', bg: 'bg-orange-900/20' },
    PORTAL_ACCESS: { icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-900/20' },
    CREATED: { icon: User, color: 'text-gray-400', bg: 'bg-gray-900/20' },
    UPDATED: { icon: User, color: 'text-gray-400', bg: 'bg-gray-900/20' }
  };

  const config = iconMap[type] || iconMap.NOTE;
  const Icon = config.icon;

  return (
    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
    </div>
  );
};

// ============================================
// ACTIVITY ITEM COMPONENT
// ============================================

interface ActivityItemComponentProps {
  activity: ActivityItem;
  isFirst: boolean;
  isLast: boolean;
}

const ActivityItemComponent: React.FC<ActivityItemComponentProps> = ({ 
  activity, 
  isFirst, 
  isLast 
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-app-dark-600" />
      )}

      <div className="flex items-start space-x-3">
        <ActivityIcon type={activity.type} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-app-gray-200">
              {activity.title}
            </h4>
            <time className="text-xs text-app-gray-500">
              {formatDate(activity.createdAt)}
            </time>
          </div>
          
          {activity.description && (
            <p className="mt-1 text-sm text-app-gray-400">
              {expanded || activity.description.length <= 100 
                ? activity.description
                : `${activity.description.substring(0, 100)}...`
              }
              {activity.description.length > 100 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="ml-1 text-primary-400 hover:text-primary-300"
                >
                  {expanded ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </p>
          )}
          
          <div className="mt-2 text-xs text-app-gray-500">
            Por {activity.createdBy}
          </div>

          {/* Metadata */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center text-xs text-app-gray-500 hover:text-app-gray-400"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Ocultar detalles
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Ver detalles
                  </>
                )}
              </button>
              
              {expanded && (
                <div className="mt-2 p-3 bg-app-dark-700 rounded-lg border border-app-dark-600">
                  <dl className="space-y-1">
                    {Object.entries(activity.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <dt className="text-app-gray-400">{key}:</dt>
                        <dd className="text-app-gray-300">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================

const EmptyActivities: React.FC = () => (
  <div className="text-center py-8">
    <Activity className="h-12 w-12 text-app-gray-500 mx-auto mb-4" />
    <h3 className="text-sm font-medium text-app-gray-300 mb-2">
      Sin actividades registradas
    </h3>
    <p className="text-xs text-app-gray-500">
      Las actividades aparecerán aquí cuando se registren interacciones con este contacto.
    </p>
  </div>
);

// ============================================
// MOCK DATA (En producción vendrá del API)
// ============================================

const getMockActivities = (contactId: number): ActivityItem[] => [
  {
    id: 1,
    type: 'CREATED',
    title: 'Contacto creado',
    description: 'El contacto fue añadido al sistema',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'Sistema',
    metadata: { source: 'MANUAL', ip: '192.168.1.1' }
  },
  {
    id: 2,
    type: 'EMAIL',
    title: 'Email de bienvenida enviado',
    description: 'Se envió un email de bienvenida al contacto con información sobre nuestros servicios.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin@eklesa.com',
    metadata: { subject: 'Bienvenido a Eklesa', template: 'welcome-email' }
  },
  {
    id: 3,
    type: 'PORTAL_ACCESS',
    title: 'Invitación al portal enviada',
    description: 'Se generó y envió una invitación para acceder al portal digital.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin@eklesa.com'
  },
  {
    id: 4,
    type: 'CALL',
    title: 'Llamada telefónica',
    description: 'Llamada de seguimiento. El contacto mostró interés en nuestros servicios.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'john.doe@eklesa.com',
    metadata: { duration: '15 minutos', outcome: 'Positivo' }
  },
  {
    id: 5,
    type: 'NOTE',
    title: 'Nota añadida',
    description: 'El contacto está interesado en recibir más información sobre nuestros paquetes premium.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'jane.smith@eklesa.com'
  }
];

// ============================================
// MAIN COMPONENT
// ============================================

const ContactActivityTimeline: React.FC<ContactActivityTimelineProps> = ({ contactId }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Mock data loading
  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      // Simular llamada al API
      await new Promise(resolve => setTimeout(resolve, 500));
      setActivities(getMockActivities(contactId));
      setLoading(false);
    };

    loadActivities();
  }, [contactId]);

  const handleRefresh = async () => {
    setLoading(true);
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 300));
    setActivities(getMockActivities(contactId));
    setLoading(false);
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  return (
    <div className="bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700">
      <div className="px-6 py-4 border-b border-app-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-app-gray-400" />
            <h3 className="text-lg font-medium text-app-gray-100">
              Actividades
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="xs" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir
            </Button>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-6">
        {loading && activities.length === 0 ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : activities.length === 0 ? (
          <EmptyActivities />
        ) : (
          <>
            <div className="space-y-6">
              {displayedActivities.map((activity, index) => (
                <ActivityItemComponent
                  key={activity.id}
                  activity={activity}
                  isFirst={index === 0}
                  isLast={index === displayedActivities.length - 1}
                />
              ))}
            </div>
            
            {activities.length > 5 && (
              <div className="mt-6 pt-4 border-t border-app-dark-700 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Ver todas ({activities.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContactActivityTimeline;