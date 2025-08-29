// src/pages/companies/CompanyListPage.tsx
// ✅ COMPANY LIST PAGE - SINCRONIZADO con endpoint unificado del backend

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Filter, 
  RefreshCw,
  FileDown,
  Upload,
  Star,
  Users as UsersIcon,
  Building2
} from 'lucide-react';

// ============================================
// UI & LAYOUT COMPONENTS
// ============================================
import { Button, IconButton } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Dropdown from '@/components/ui/Dropdown';
import { Pagination } from '@/components/ui/Pagination';
import Page from '@/components/layout/Page';

// ============================================
// COMPANY COMPONENTS
// ============================================
import CompaniesTable from '@/components/companies/CompaniesTable';
import { CompaniesFilters } from '@/components/companies/CompaniesFilters';
import { CompaniesBulkActions } from '@/components/companies/CompaniesBulkActions';
import { StatsCards } from '@/components/shared/StatsCards';
import type { StatCardConfig } from '@/components/shared/StatsCards';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

// ============================================
// HOOKS & SERVICES
// ============================================
import { 
  useBulkCompanyOperations, 
  useCompanyOperations, 
  COMPANY_STATS_QUERY_KEY 
} from '@/hooks/useCompanies';
import { companyApi } from '@/services/api/companyApi';
import { useSearchDebounce } from '@/hooks/useDebounce';
import { getDisplayName, type CompanyDTO, type CompanyType, type CompanySearchCriteria } from '@/types/company.types';
import { cn } from '@/utils/cn';
import { toastSuccess } from '@/services/notifications/toastService';
import { useErrorHandler } from '@/hooks/useErrorHandler';

// ============================================
// MAIN COMPONENT
// ============================================
const CompanyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ============================================
  // LOCAL STATE para UI y Filtros
  // ============================================
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 0); // 0-based
  const [companyToDelete, setCompanyToDelete] = useState<CompanyDTO | null>(null);

  const debouncedSearchTerm = useSearchDebounce(searchTerm, 300);

  // 🔧 CORREGIDO: searchCriteria limpio y usando searchTerm (no search)
  const searchCriteria = useMemo((): CompanySearchCriteria => {
    const criteria: CompanySearchCriteria = {};
    if (debouncedSearchTerm) {
      criteria.search = debouncedSearchTerm;
    }
    return criteria;
  }, [debouncedSearchTerm]);

  // ============================================
  // DATA FETCHING CON REACT QUERY (ÚNICA FUENTE DE VERDAD)
  // ============================================

  const { 
    data: companiesData, 
    isLoading: isLoadingCompanies, 
    isFetching: isFetchingCompanies,
    error: companiesError,
    refetch: refetchCompanies,
  } = useQuery({
    // 🔧 CORREGIDO: Query key más explícita
    queryKey: ['companies', 'list', searchCriteria, currentPage],
    queryFn: () => companyApi.searchCompanies(searchCriteria, { page: currentPage, size: 25, sort: ['updatedAt,desc'] }),
    
    // 🔧 AÑADIDO: Condición enabled para prevenir llamadas innecesarias
    // No ejecutar la query si el debouncing aún no ha terminado la primera vez
    enabled: !!debouncedSearchTerm || searchTerm === '',
    
    placeholderData: (previousData) => previousData,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const companies = companiesData?.content || [];
  const totalCompanies = companiesData?.totalElements || 0;
  const totalPages = companiesData?.totalPages || 0;

  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: COMPANY_STATS_QUERY_KEY,
    queryFn: () => companyApi.getCompanyStats(),
  });

  // ============================================
  // HOOKS DE ZUSTAND (Para acciones y estado de UI)
  // ============================================
  const { deleteCompany, deleting } = useCompanyOperations();
  const {
    selectedCompanyIds,
    hasSelection,
    selectionCount,
    bulkOperationLoading,
    selectAllCompanies,
    deselectAllCompanies,
    bulkUpdateCompanies,
    bulkDeleteCompanies
  } = useBulkCompanyOperations();
  const { handleError } = useErrorHandler();

  // ============================================
  // STATS CARDS CONFIGURATION
  // ============================================
  const companyStatConfigs: StatCardConfig[] = [
    { key: 'total', title: 'Total Empresas', description: 'Número total de organizaciones en el sistema.', icon: Building2, variant: 'default', format: 'number' },
    { key: 'companyTypeCount', title: 'Tipo Empresa', description: 'Organizaciones de tipo comercial.', icon: Building2, variant: 'info', format: 'number' },
    { key: 'familyTypeCount', title: 'Tipo Familia', description: 'Grupos familiares registrados.', icon: UsersIcon, variant: 'success', format: 'number' },
    { key: 'largeCompanyCount', title: 'Empresas Grandes', description: 'Organizaciones con más de 50 empleados.', icon: Star, variant: 'warning', format: 'number' },
  ];

  // Mapear stats a formato esperado por StatsCards
  const mappedStats = useMemo(() => {
    if (!stats) return undefined;
    
    return {
      total: totalCompanies,
      companyTypeCount: stats.byType?.COMPANY || 0,
      familyTypeCount: stats.byType?.FAMILY || 0,
      largeCompanyCount: (stats.bySize?.LARGE || 0) + (stats.bySize?.ENTERPRISE || 0),
    };
  }, [stats, totalCompanies]);

  // ============================================
  // EFFECTS
  // ============================================
  
  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (currentPage > 0) params.set('page', String(currentPage));
    setSearchParams(params, { replace: true });
  }, [searchTerm, currentPage, setSearchParams]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleCreateCompany = useCallback(() => navigate('/companies/new'), [navigate]);
  const handleCompanyClick = useCallback((company: CompanyDTO) => navigate(`/companies/${company.id}`), [navigate]);
  const handleCompanyEdit = useCallback((company: CompanyDTO) => navigate(`/companies/${company.id}/edit`), [navigate]);
  
  const handleCompanyDelete = useCallback((company: CompanyDTO) => {
    setCompanyToDelete(company);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!companyToDelete) return;

    deleteCompany(companyToDelete.id, () => {
      toastSuccess(`La empresa "${getDisplayName(companyToDelete)}" ha sido eliminada.`);
      setCompanyToDelete(null);
    });
  }, [companyToDelete, deleteCompany]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchCompanies(), refetchStats()]);
  }, [refetchCompanies, refetchStats]);

  const handleExport = useCallback(async (format: 'csv' | 'excel') => {
    try {
      const blob = format === 'csv' 
        ? await companyApi.exportCompaniesCSV(searchCriteria)
        : await companyApi.exportCompaniesExcel(searchCriteria);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `empresas_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toastSuccess(`Empresas exportadas como ${format.toUpperCase()}`);
    } catch (error) {
      handleError(error, 'Error al exportar empresas');
    }
  }, [searchCriteria, handleError]);
  
  const handleBulkTypeUpdate = useCallback(async (type: CompanyType) => {
    try {
      await bulkUpdateCompanies({ type });
    } catch (error) {
      handleError(error, 'Error al actualizar empresas');
    }
  }, [bulkUpdateCompanies, handleError]);

  const handleBulkDelete = useCallback(async () => {
    try {
      await bulkDeleteCompanies();
    } catch (error) {
      handleError(error, 'Error al eliminar empresas');
    }
  }, [bulkDeleteCompanies, handleError]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(0);
  }, []);

  const exportDropdownItems = [
    { id: 'export-csv', label: 'Exportar CSV', icon: FileDown, onClick: () => handleExport('csv') },
    { id: 'export-excel', label: 'Exportar Excel', icon: FileDown, onClick: () => handleExport('excel') },
    { type: 'separator' as const },
    { id: 'import', label: 'Importar empresas', icon: Upload, onClick: () => navigate('/companies/import') }
  ];

  // ============================================
  // RENDER HELPERS
  // ============================================
  const renderHeader = () => (
    <div className="space-y-6">
      <StatsCards 
        configs={companyStatConfigs}
        stats={mappedStats}
        isLoading={isLoadingStats}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-crm-company-500/10 rounded-lg">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-crm-company-500" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-app-gray-100">Empresas</h1>
            <div className="flex items-center gap-2 text-sm text-app-gray-400">
              {isLoadingCompanies ? (
                <span className="h-4 bg-app-dark-700 rounded w-32 animate-pulse" />
              ) : (
                <span>{totalCompanies.toLocaleString()} empresas totales</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton onClick={handleRefresh} disabled={isFetchingCompanies} tooltip="Actualizar" aria-label="Actualizar empresas">
            <RefreshCw className={cn('h-4 w-4', isFetchingCompanies && 'animate-spin')} />
          </IconButton>
          <Dropdown trigger={<IconButton tooltip="Exportar / Importar" aria-label="Opciones de exportación e importación"><FileDown className="h-4 w-4" /></IconButton>} items={exportDropdownItems} align="end" size="sm" />
          <Button onClick={handleCreateCompany} size="sm" leftIcon={<Plus className="h-4 w-4" />} className="ml-2">
            <span className="hidden sm:inline">Nueva Empresa</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Buscar empresas por nombre, email o teléfono..." 
            onClear={handleClearSearch} 
            className="w-full" 
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={cn('flex items-center gap-2')} leftIcon={<Filter className="h-4 w-4" />}>
            Filtros
          </Button>
        </div>
      </div>
      
      {showFilters && (
        <CompaniesFilters 
          searchCriteria={searchCriteria} 
          onCriteriaChange={() => {}} // 🔧 MANTENIDO: Placeholder por ahora
          onClose={() => setShowFilters(false)} 
          className="border border-app-dark-600 rounded-lg p-4 bg-app-dark-800" 
        />
      )}
      
      {hasSelection && (
        <CompaniesBulkActions 
          selectedCount={selectionCount} 
          onBulkDelete={handleBulkDelete} 
          onBulkTypeUpdate={handleBulkTypeUpdate} 
          onDeselectAll={deselectAllCompanies} 
          isLoading={bulkOperationLoading} 
          className="bg-app-dark-800 border border-app-dark-600 rounded-lg p-3" 
        />
      )}
    </div>
  );

  const renderContent = () => {
    if (companiesError) {
      return (
        <ErrorMessage title="Error de conexión" message={(companiesError as Error).message} onRetry={handleRefresh} variant="destructive" />
      );
    }
    return (
      <>
        <CompaniesTable
          companies={companies}
          isLoading={isLoadingCompanies}
          totalCompanies={totalCompanies}
          onCompanyClick={handleCompanyClick}
          onCompanyEdit={handleCompanyEdit}
          onCompanyDelete={handleCompanyDelete}
          selectedCompanyIds={selectedCompanyIds}
          onSelectAll={() => selectAllCompanies(companies.map(c => c.id))}
          onDeselectAll={deselectAllCompanies}
        />
        
        {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage + 1} // Convertimos de 0-based a 1-based para la UI
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page - 1)} // Convertimos de vuelta de 1-based a 0-based
              />
            </div>
        )}
      </>
    );
  };

  return (
    <Page title="Empresas" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Empresas' }]} className="space-y-6">
      {renderHeader()}
      {renderContent()}
      {/* Diálogo de Confirmación de Borrado */}
      {companyToDelete && (
        <ConfirmDialog
          isOpen={!!companyToDelete}
          onClose={() => setCompanyToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={`Eliminar empresa ${getDisplayName(companyToDelete)}`}
          description="Esta acción moverá la empresa a la papelera. ¿Estás seguro?"
          confirmLabel="Sí, eliminar"
          isConfirming={deleting.has(companyToDelete.id)}
        />
      )}
    </Page>
  );
};

export default CompanyListPage;