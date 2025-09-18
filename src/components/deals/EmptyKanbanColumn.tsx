// src/components/deals/EmptyKanbanColumn.tsx
// ✅ EMPTY KANBAN COLUMN - Estado vacío para columnas sin deals
// 🔧 CORREGIDO: Validación defensiva para stageName

import React from 'react';
import { Plus, Target, Lightbulb } from 'lucide-react';

// ============================================
// UI COMPONENTS
// ============================================
import { Button } from '@/components/ui/Button';

// ============================================
// UTILS
// ============================================
import { cn } from '@/utils/cn';

// ============================================
// TYPES
// ============================================

interface EmptyKanbanColumnProps {
  stageName: string;
  onCreateDeal: () => void;
  className?: string;
  showTips?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const EmptyKanbanColumn: React.FC<EmptyKanbanColumnProps> = ({
  stageName,
  onCreateDeal,
  className,
  showTips = true,
}) => {
  // ============================================
  // TIPS DINÁMICOS POR ETAPA - CON VALIDACIÓN DEFENSIVA
  // ============================================
  const getTipsForStage = (stageName: string): string[] => {
    // ✅ VALIDACIÓN DEFENSIVA: Verificar que stageName existe y es string
    if (!stageName || typeof stageName !== 'string') {
      return [
        'Crea una nueva oportunidad',
        'Mueve deals desde otras etapas',
        'Importa desde hojas de cálculo'
      ];
    }
    
    const lowerStageName = stageName.toLowerCase();
    
    if (lowerStageName.includes('lead') || lowerStageName.includes('prospecto')) {
      return [
        'Importa contactos desde tu CRM',
        'Conecta formularios web',
        'Sincroniza con redes sociales'
      ];
    }
    
    if (lowerStageName.includes('contacto') || lowerStageName.includes('inicial')) {
      return [
        'Programa llamadas de seguimiento',
        'Envía emails personalizados',
        'Programa reuniones de descubrimiento'
      ];
    }
    
    if (lowerStageName.includes('propuesta') || lowerStageName.includes('cotización')) {
      return [
        'Crea propuestas personalizadas',
        'Define términos y condiciones',
        'Establece fechas de vencimiento'
      ];
    }
    
    if (lowerStageName.includes('negociación') || lowerStageName.includes('cierre')) {
      return [
        'Agenda llamadas de cierre',
        'Prepara contratos finales',
        'Define condiciones de pago'
      ];
    }
    
    // Tips genéricos
    return [
      'Crea una nueva oportunidad',
      'Mueve deals desde otras etapas',
      'Importa desde hojas de cálculo'
    ];
  };

  const tips = getTipsForStage(stageName);
  
  // ✅ VALIDACIÓN DEFENSIVA: Fallback para stageName
  const displayStageName = stageName || 'esta etapa';

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={cn(
      // Layout base
      'flex flex-col items-center justify-center p-6 text-center',
      'min-h-[200px] border-2 border-dashed border-app-dark-600 rounded-lg',
      'bg-app-dark-800/30 hover:bg-app-dark-800/50 transition-colors duration-200',
      
      className
    )}>
      {/* Icono principal */}
      <div className="mb-4">
        <div className={cn(
          'w-12 h-12 rounded-full bg-app-dark-700 border border-app-dark-600',
          'flex items-center justify-center group-hover:border-app-dark-500 transition-colors'
        )}>
          <Target className="h-6 w-6 text-app-gray-400" />
        </div>
      </div>

      {/* Título */}
      <h3 className="text-sm font-medium text-app-gray-300 mb-2">
        Sin oportunidades en "{displayStageName}"
      </h3>

      {/* Descripción */}
      <p className="text-xs text-app-gray-400 mb-4 max-w-sm">
        Esta etapa no tiene oportunidades asignadas. 
        Puedes crear una nueva o mover deals desde otras etapas.
      </p>

      {/* Botón de acción principal */}
      <Button
        size="sm"
        variant="outline"
        icon={Plus}
        onClick={onCreateDeal}
        className="mb-4"
      >
        Crear Oportunidad
      </Button>

      {/* Tips contextuales */}
      {showTips && tips.length > 0 && (
        <div className="w-full max-w-xs">
          <div className="flex items-center space-x-1 mb-2">
            <Lightbulb className="h-3 w-3 text-yellow-400" />
            <span className="text-xs font-medium text-app-gray-400">Sugerencias:</span>
          </div>
          
          <ul className="space-y-1">
            {tips.slice(0, 2).map((tip, index) => (
              <li 
                key={index}
                className="text-xs text-app-gray-500 text-left flex items-start"
              >
                <span className="text-app-gray-600 mr-2">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Zona de drop visual */}
      <div className={cn(
        'absolute inset-2 rounded-lg border-2 border-transparent',
        'transition-all duration-200 pointer-events-none',
        // Estas clases se activarían cuando se esté dragging sobre esta zona
        // 'border-app-accent-500 bg-app-accent-500/10'
      )}>
        {/* Indicador visual de drop zone */}
      </div>
    </div>
  );
};

export default EmptyKanbanColumn;