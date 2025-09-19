NOTAS:
1. No tenemos useKanban en el hooks, tenemos el metodo en useDeal asi:
/**
 * Hook para obtener datos del Kanban de un pipeline específico
 */
export const usePipelineKanbanData = (pipelineId: number) => {
  return useQuery({
    queryKey: DEAL_PIPELINE_KANBAN_QUERY_KEY(pipelineId),
    queryFn: () => kanbanApi.getPipelineKanbanData(pipelineId),
    enabled: !!pipelineId && pipelineId > 0,
    staleTime: 30 * 1000,
  });
};

