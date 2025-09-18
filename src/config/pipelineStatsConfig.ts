// src/config/pipelineStatsConfig.ts
// ✅ CONFIGURACIONES DE STATS PARA PIPELINE KANBAN
// Siguiendo arquitectura Eklesa: configuración separada de lógica
// 🔧 NIVEL SALESFORCE: Incluye Valor Ponderado y métricas avanzadas

import { 
    Target, 
    DollarSign, 
    TrendingUp, 
    BarChart3,
    Flame,
    Clock,
    Award,
    Users
  } from 'lucide-react';
  
  import type { StatCardConfig } from '@/components/shared/StatsCards';
  
  // ============================================
  // PIPELINE STATS CONFIGURATIONS
  // ============================================
  
  /**
   * Configuración de stats cards para la vista Kanban del Pipeline
   * Estas son las 4 métricas principales que aparecen en la cabecera
   */
  export const PIPELINE_KANBAN_STATS_CONFIG: StatCardConfig[] = [
    {
      key: 'totalDeals',
      title: 'Total Oportunidades',
      description: 'Número total de oportunidades activas en el pipeline',
      icon: Target,
      variant: 'info',
      format: 'number',
    },
    {
      key: 'totalValue',
      title: 'Valor en Pipeline',
      description: 'Valor total de todas las oportunidades en el pipeline',
      icon: DollarSign,
      variant: 'success',
      format: 'currency',
    },
    {
      key: 'weightedValue', // 🔧 NUEVO: La métrica crítica que faltaba
      title: 'Valor Ponderado',
      description: 'Valor total ponderado por probabilidad (valor × probabilidad). Métrica más realista que el valor total.',
      icon: TrendingUp,
      variant: 'accent',
      format: 'currency',
    },
    {
      key: 'conversionRate',
      title: 'Tasa de Conversión',
      description: 'Porcentaje de oportunidades que se convierten en ventas exitosas',
      icon: Award,
      variant: 'warning',
      format: 'percentage',
      suffix: '%',
    },
  ];
  
  /**
   * Configuración extendida para dashboard detallado
   * Para cuando se necesiten más métricas
   */
  export const PIPELINE_DETAILED_STATS_CONFIG: StatCardConfig[] = [
    ...PIPELINE_KANBAN_STATS_CONFIG,
    {
      key: 'averageDealSize',
      title: 'Deal Promedio',
      description: 'Valor promedio por oportunidad en el pipeline',
      icon: BarChart3,
      variant: 'default',
      format: 'currency',
    },
    {
      key: 'averageDaysToClose',
      title: 'Días Promedio',
      description: 'Tiempo promedio para cerrar una oportunidad',
      icon: Clock,
      variant: 'info',
      format: 'number',
      suffix: ' días',
    },
    {
      key: 'highPriorityDeals',
      title: 'Alta Prioridad',
      description: 'Oportunidades marcadas como alta prioridad o urgentes',
      icon: Flame,
      variant: 'warning',
      format: 'number',
    },
    {
      key: 'activeOwners',
      title: 'Propietarios Activos',
      description: 'Número de usuarios con oportunidades asignadas',
      icon: Users,
      variant: 'default',
      format: 'number',
    },
  ];
  
  // ============================================
  // HELPER FUNCTIONS PARA CALCULAR MÉTRICAS
  // ============================================
  
  /**
   * Calcula el valor ponderado del pipeline
   * Esta es la métrica crítica que estaba faltando
   */
  export const calculateWeightedValue = (deals: any[]): number => {
    if (!Array.isArray(deals)) return 0;
    
    return deals.reduce((total, deal) => {
      const amount = deal?.amount || 0;
      const probability = (deal?.probability || 0) / 100; // Convertir porcentaje a decimal
      return total + (amount * probability);
    }, 0);
  };
  
  /**
   * Calcula la tasa de conversión del pipeline
   */
  export const calculateConversionRate = (
    wonDeals: number, 
    totalClosedDeals: number
  ): number => {
    if (totalClosedDeals === 0) return 0;
    return (wonDeals / totalClosedDeals) * 100;
  };
  
  /**
   * Calcula el tamaño promedio de deal
   */
  export const calculateAverageDealSize = (
    totalValue: number, 
    totalDeals: number
  ): number => {
    if (totalDeals === 0) return 0;
    return totalValue / totalDeals;
  };
  
  /**
   * Cuenta deals de alta prioridad
   */
  export const countHighPriorityDeals = (deals: any[]): number => {
    if (!Array.isArray(deals)) return 0;
    
    return deals.filter(deal => 
      deal?.priority === 'HIGH' || deal?.priority === 'URGENT'
    ).length;
  };
  
  /**
   * Cuenta propietarios únicos activos
   */
  export const countActiveOwners = (deals: any[]): number => {
    if (!Array.isArray(deals)) return 0;
    
    const uniqueOwners = new Set(
      deals
        .map(deal => deal?.ownerCognitoSub)
        .filter(Boolean)
    );
    
    return uniqueOwners.size;
  };
  
  // ============================================
  // FUNCIÓN PRINCIPAL PARA PROCESAR DATOS DEL KANBAN
  // ============================================
  
  /**
   * Procesa los datos del kanban para generar las métricas
   * Esta función toma los datos raw del backend y calcula todas las métricas
   */
  export const processPipelineStats = (kanbanData: any) => {
    if (!kanbanData?.pipeline?.stages) {
      return {
        totalDeals: 0,
        totalValue: 0,
        weightedValue: 0,
        conversionRate: 0,
        averageDealSize: 0,
        averageDaysToClose: 0,
        highPriorityDeals: 0,
        activeOwners: 0,
      };
    }
  
    // Recopilar todos los deals de todas las etapas
    const allDeals = kanbanData.pipeline.stages.flatMap((stage: any) => stage.deals || []);
    
    // Métricas básicas
    const totalDeals = allDeals.length;
    const totalValue = allDeals.reduce((sum: number, deal: any) => sum + (deal?.amount || 0), 0);
    
    // 🔧 MÉTRICA CRÍTICA: Valor ponderado
    const weightedValue = calculateWeightedValue(allDeals);
    
    // Métricas avanzadas
    const averageDealSize = calculateAverageDealSize(totalValue, totalDeals);
    const highPriorityDeals = countHighPriorityDeals(allDeals);
    const activeOwners = countActiveOwners(allDeals);
    
    // Calcular días promedio (si tenemos esos datos)
    const dealsWithDays = allDeals.filter((deal: any) => deal?.daysInPipeline);
    const averageDaysToClose = dealsWithDays.length > 0 
      ? dealsWithDays.reduce((sum: number, deal: any) => sum + (deal.daysInPipeline || 0), 0) / dealsWithDays.length
      : 0;
    
    // Para calcular conversion rate necesitaríamos datos históricos
    // Por ahora lo dejamos en 0 o se puede calcular con datos adicionales
    const conversionRate = 0;
  
    return {
      totalDeals,
      totalValue,
      weightedValue, // 🔧 LA MÉTRICA QUE FALTABA
      conversionRate,
      averageDealSize,
      averageDaysToClose,
      highPriorityDeals,
      activeOwners,
    };
  };
  
  // ============================================
  // EXPORT DEFAULT PARA FÁCIL IMPORTACIÓN
  // ============================================
  
  export default {
    kanban: PIPELINE_KANBAN_STATS_CONFIG,
    detailed: PIPELINE_DETAILED_STATS_CONFIG,
    calculate: {
      weightedValue: calculateWeightedValue,
      conversionRate: calculateConversionRate,
      averageDealSize: calculateAverageDealSize,
      highPriorityDeals: countHighPriorityDeals,
      activeOwners: countActiveOwners,
    },
    process: processPipelineStats,
  };