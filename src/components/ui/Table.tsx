// src/components/ui/Table.tsx
// Table enterprise component siguiendo tu guía arquitectónica
// Mobile-first + TypeScript strict + Enterprise features

import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Checkbox } from './Checkbox';

// ============================================
// TABLE TYPES
// ============================================

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T = any> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (props: { row: T; value: any; index: number }) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  // Mobile responsiveness
  hideOnMobile?: boolean;
  showOnlyOnMobile?: boolean;
  mobileLabel?: string;
}

export interface TableProps<T = any> {
  // Data
  data: T[];
  columns: Column<T>[];
  
  // Selection
  enableSelection?: boolean;
  selectedRows?: Set<string | number>;
  onRowSelect?: (rowId: string | number) => void;
  onSelectAll?: () => void;
  getRowId?: (row: T, index: number) => string | number;
  
  // Sorting
  enableSorting?: boolean;
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort?: (columnId: string, direction: SortDirection) => void;
  
  // Loading & Empty
  loading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  
  // Row actions
  onRowClick?: (row: T, index: number) => void;
  rowActions?: (row: T, index: number) => React.ReactNode;
  
  // Styling
  variant?: 'default' | 'bordered' | 'striped';
  size?: 'sm' | 'md' | 'lg';
  stickyHeader?: boolean;
  
  // Mobile
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  mobileView?: 'cards' | 'stack' | 'table';
  
  // Pagination info (for display)
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  
  className?: string;
  tableClassName?: string;
}

// ============================================
// TABLE VARIANTS
// ============================================

const tableVariants = {
  variants: {
    variant: {
      default: {
        table: 'bg-app-dark-800',
        header: 'bg-app-dark-700 border-b border-app-dark-600',
        row: 'border-b border-app-dark-600 hover:bg-app-dark-700 transition-colors',
        cell: 'text-app-gray-200',
      },
      bordered: {
        table: 'bg-app-dark-800 border border-app-dark-600 rounded-lg overflow-hidden',
        header: 'bg-app-dark-700 border-b border-app-dark-600',
        row: 'border-b border-app-dark-600 hover:bg-app-dark-700 transition-colors last:border-b-0',
        cell: 'text-app-gray-200',
      },
      striped: {
        table: 'bg-app-dark-800',
        header: 'bg-app-dark-700 border-b border-app-dark-600',
        row: 'border-b border-app-dark-600 hover:bg-app-dark-700 transition-colors even:bg-app-dark-750',
        cell: 'text-app-gray-200',
      },
    },
    size: {
      sm: {
        cell: 'px-3 py-2 text-xs',
        header: 'px-3 py-2 text-xs font-medium',
      },
      md: {
        cell: 'px-4 py-3 text-sm',
        header: 'px-4 py-3 text-sm font-medium',
      },
      lg: {
        cell: 'px-6 py-4 text-base',
        header: 'px-6 py-4 text-base font-medium',
      },
    },
  },
};

// ============================================
// TABLE COMPONENTS
// ============================================

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    selected?: boolean;
    clickable?: boolean;
  }
>(({ className, selected, clickable, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      selected && 'bg-app-dark-600',
      clickable && 'cursor-pointer',
      className
    )}
    data-state={selected ? 'selected' : undefined}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    sortable?: boolean;
    sortDirection?: SortDirection;
    onSort?: () => void;
  }
>(({ className, sortable, sortDirection, onSort, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-app-gray-300 [&:has([role=checkbox])]:pr-0',
      sortable && 'cursor-pointer select-none hover:text-white',
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    <div className="flex items-center space-x-2">
      <span>{children}</span>
      {sortable && (
        <div className="flex flex-col">
          {sortDirection === null && <ArrowUpDown className="h-4 w-4 opacity-50" />}
          {sortDirection === 'asc' && <ChevronUp className="h-4 w-4" />}
          {sortDirection === 'desc' && <ChevronDown className="h-4 w-4" />}
        </div>
      )}
    </div>
  </th>
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

// ============================================
// DATA TABLE COMPONENT
// ============================================

function DataTable<T = any>({
  data,
  columns,
  enableSelection = false,
  selectedRows = new Set(),
  onRowSelect,
  onSelectAll,
  getRowId = (row, index) => index,
  enableSorting = false,
  sortBy,
  sortDirection,
  onSort,
  loading = false,
  loadingRows = 5,
  emptyState,
  onRowClick,
  rowActions,
  variant = 'default',
  size = 'md',
  stickyHeader = false,
  mobileBreakpoint = 'md',
  mobileView = 'cards',
  pagination,
  className,
  tableClassName,
}: TableProps<T>) {
  const [internalSort, setInternalSort] = useState<{
    column: string;
    direction: SortDirection;
  }>({ column: sortBy || '', direction: sortDirection || null });

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!enableSorting) return;

    let newDirection: SortDirection = 'asc';
    
    if (internalSort.column === columnId) {
      if (internalSort.direction === 'asc') {
        newDirection = 'desc';
      } else if (internalSort.direction === 'desc') {
        newDirection = null;
      }
    }

    const newSort = { column: columnId, direction: newDirection };
    setInternalSort(newSort);
    onSort?.(columnId, newDirection);
  };

  // Selection helpers
  const allSelected = data.length > 0 && data.every((row, index) => 
    selectedRows.has(getRowId(row, index))
  );
  const someSelected = data.some((row, index) => 
    selectedRows.has(getRowId(row, index))
  );

  // Get table styling
  const variantStyles = tableVariants.variants.variant[variant];
  const sizeStyles = tableVariants.variants.size[size];

  // Mobile columns (visible on mobile)
  const mobileColumns = columns.filter(col => !col.hideOnMobile);
  const desktopColumns = columns.filter(col => !col.showOnlyOnMobile);

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        {/* Desktop skeleton */}
        <div className={cn('hidden', `${mobileBreakpoint}:block`)}>
          <Table className={cn(variantStyles.table, tableClassName)}>
            <TableHeader className={variantStyles.header}>
              <TableRow>
                {enableSelection && (
                  <TableHead className="w-12">
                    <div className="h-4 w-4 bg-app-dark-600 rounded animate-pulse" />
                  </TableHead>
                )}
                {desktopColumns.map((column) => (
                  <TableHead key={column.id} className={column.headerClassName}>
                    <div className="h-4 bg-app-dark-600 rounded animate-pulse" style={{ width: '60%' }} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: loadingRows }).map((_, index) => (
                <TableRow key={index}>
                  {enableSelection && (
                    <TableCell>
                      <div className="h-4 w-4 bg-app-dark-600 rounded animate-pulse" />
                    </TableCell>
                  )}
                  {desktopColumns.map((column) => (
                    <TableCell key={column.id} className={column.cellClassName}>
                      <div className="h-4 bg-app-dark-600 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile skeleton */}
        <div className={cn('block', `${mobileBreakpoint}:hidden`)}>
          <div className="space-y-3">
            {Array.from({ length: loadingRows }).map((_, index) => (
              <div key={index} className="bg-app-dark-800 rounded-lg p-4 animate-pulse">
                <div className="space-y-3">
                  <div className="h-5 bg-app-dark-600 rounded w-3/4" />
                  <div className="h-4 bg-app-dark-600 rounded w-1/2" />
                  <div className="flex space-x-2">
                    <div className="h-3 bg-app-dark-600 rounded w-16" />
                    <div className="h-3 bg-app-dark-600 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && data.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        {emptyState || (
          <div className="text-center py-12">
            <p className="text-app-gray-400">No hay datos para mostrar</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Table */}
      <div className={cn('hidden', `${mobileBreakpoint}:block`)}>
        <div className="relative overflow-auto">
          <Table className={cn(variantStyles.table, tableClassName)}>
            <TableHeader 
              className={cn(
                variantStyles.header,
                stickyHeader && 'sticky top-0 z-10'
              )}
            >
              <TableRow>
                {/* Selection column */}
                {enableSelection && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onChange={onSelectAll}
                      aria-label="Seleccionar todo"
                    />
                  </TableHead>
                )}
                
                {/* Data columns */}
                {desktopColumns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      sizeStyles.header,
                      column.headerClassName,
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                    }}
                    sortable={column.sortable && enableSorting}
                    sortDirection={
                      internalSort.column === column.id ? internalSort.direction : null
                    }
                    onSort={() => handleSort(column.id)}
                  >
                    {column.header}
                  </TableHead>
                ))}
                
                {/* Actions column */}
                {rowActions && (
                  <TableHead className="w-12">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {data.map((row, index) => {
                const rowId = getRowId(row, index);
                const isSelected = selectedRows.has(rowId);
                
                return (
                  <TableRow
                    key={rowId}
                    className={variantStyles.row}
                    selected={isSelected}
                    clickable={!!onRowClick}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {/* Selection cell */}
                    {enableSelection && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => onRowSelect?.(rowId)}
                          aria-label={`Seleccionar fila ${index + 1}`}
                        />
                      </TableCell>
                    )}
                    
                    {/* Data cells */}
                    {desktopColumns.map((column) => {
                      const value = column.accessorKey ? row[column.accessorKey] : undefined;
                      const cellContent = column.cell 
                        ? column.cell({ row, value, index })
                        : value?.toString() || '';
                      
                      return (
                        <TableCell
                          key={column.id}
                          className={cn(
                            sizeStyles.cell,
                            variantStyles.cell,
                            column.cellClassName,
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          )}
                        >
                          {cellContent}
                        </TableCell>
                      );
                    })}
                    
                    {/* Actions cell */}
                    {rowActions && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {rowActions(row, index)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile View */}
      <div className={cn('block', `${mobileBreakpoint}:hidden`)}>
        {mobileView === 'cards' ? (
          <MobileCardView
            data={data}
            columns={mobileColumns}
            selectedRows={selectedRows}
            onRowSelect={onRowSelect}
            onRowClick={onRowClick}
            getRowId={getRowId}
            enableSelection={enableSelection}
            rowActions={rowActions}
          />
        ) : (
          <MobileStackView
            data={data}
            columns={mobileColumns}
            selectedRows={selectedRows}
            onRowSelect={onRowSelect}
            onRowClick={onRowClick}
            getRowId={getRowId}
            enableSelection={enableSelection}
            rowActions={rowActions}
          />
        )}
      </div>

      {/* Pagination info */}
      {pagination && (
        <div className="mt-4 text-sm text-app-gray-400 text-center">
          Mostrando {Math.min(pagination.pageSize, data.length)} de {pagination.total} elementos
        </div>
      )}
    </div>
  );
}

// ============================================
// MOBILE VIEWS
// ============================================

function MobileCardView<T>({
  data,
  columns,
  selectedRows,
  onRowSelect,
  onRowClick,
  getRowId,
  enableSelection,
  rowActions,
}: {
  data: T[];
  columns: Column<T>[];
  selectedRows: Set<string | number>;
  onRowSelect?: (rowId: string | number) => void;
  onRowClick?: (row: T, index: number) => void;
  getRowId: (row: T, index: number) => string | number;
  enableSelection: boolean;
  rowActions?: (row: T, index: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {data.map((row, index) => {
        const rowId = getRowId(row, index);
        const isSelected = selectedRows.has(rowId);
        
        return (
          <div
            key={rowId}
            className={cn(
              'bg-app-dark-800 rounded-lg p-4 border border-app-dark-600',
              'transition-colors',
              isSelected && 'bg-app-dark-600 border-app-accent-500',
              onRowClick && 'cursor-pointer hover:bg-app-dark-700'
            )}
            onClick={() => onRowClick?.(row, index)}
          >
            <div className="space-y-3">
              {/* Selection and actions header */}
              {(enableSelection || rowActions) && (
                <div className="flex items-center justify-between">
                  {enableSelection && (
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onRowSelect?.(rowId)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Seleccionar elemento ${index + 1}`}
                    />
                  )}
                  {rowActions && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {rowActions(row, index)}
                    </div>
                  )}
                </div>
              )}
              
              {/* Card content */}
              <div className="space-y-2">
                {columns.map((column) => {
                  const value = column.accessorKey ? row[column.accessorKey] : undefined;
                  const cellContent = column.cell 
                    ? column.cell({ row, value, index })
                    : value?.toString() || '';
                  
                  if (!cellContent && cellContent !== 0) return null;
                  
                  return (
                    <div key={column.id} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-app-gray-400 min-w-0 flex-shrink-0 mr-3">
                        {column.mobileLabel || column.header}:
                      </span>
                      <span className="text-sm text-app-gray-200 text-right min-w-0 flex-1">
                        {cellContent}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MobileStackView<T>({
  data,
  columns,
  selectedRows,
  onRowSelect,
  onRowClick,
  getRowId,
  enableSelection,
  rowActions,
}: {
  data: T[];
  columns: Column<T>[];
  selectedRows: Set<string | number>;
  onRowSelect?: (rowId: string | number) => void;
  onRowClick?: (row: T, index: number) => void;
  getRowId: (row: T, index: number) => string | number;
  enableSelection: boolean;
  rowActions?: (row: T, index: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {data.map((row, index) => {
        const rowId = getRowId(row, index);
        const isSelected = selectedRows.has(rowId);
        
        return (
          <div
            key={rowId}
            className={cn(
              'border-b border-app-dark-600 pb-4 last:border-b-0',
              onRowClick && 'cursor-pointer'
            )}
            onClick={() => onRowClick?.(row, index)}
          >
            <div className="space-y-2">
              {/* First row with selection and primary content */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {enableSelection && (
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onRowSelect?.(rowId)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Seleccionar elemento ${index + 1}`}
                    />
                  )}
                  {/* Primary column content */}
                  {columns[0] && (
                    <div className="min-w-0 flex-1">
                      {(() => {
                        const column = columns[0];
                        const value = column.accessorKey ? row[column.accessorKey] : undefined;
                        return column.cell 
                          ? column.cell({ row, value, index })
                          : value?.toString() || '';
                      })()}
                    </div>
                  )}
                </div>
                
                {rowActions && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {rowActions(row, index)}
                  </div>
                )}
              </div>
              
              {/* Secondary content */}
              {columns.slice(1).map((column) => {
                const value = column.accessorKey ? row[column.accessorKey] : undefined;
                const cellContent = column.cell 
                  ? column.cell({ row, value, index })
                  : value?.toString() || '';
                
                if (!cellContent && cellContent !== 0) return null;
                
                return (
                  <div key={column.id} className="text-sm text-app-gray-400 pl-6">
                    {cellContent}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  DataTable,
};

export default DataTable; 
