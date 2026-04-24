import React from 'react';
import { cn } from '../../utils/cn';

interface Column<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  striped?: boolean;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado',
  onRowClick,
  className,
  sortBy,
  sortOrder,
  onSort,
  striped = false,
}: TableProps<T>) {
  const getNestedValue = (obj: T, key: string): unknown => {
    return key.split('.').reduce((acc: unknown, k) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[k];
      }
      return undefined;
    }, obj);
  };

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-gray-200', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  !col.align && 'text-left',
                  col.sortable && 'cursor-pointer select-none hover:text-gray-700',
                  col.width
                )}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortBy === col.key && (
                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn('bg-white divide-y divide-gray-100')}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={String(row[keyField])}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-blue-50',
                  striped && rowIndex % 2 === 1 && 'bg-gray-50/50'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => {
                  const value = getNestedValue(row, col.key);
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-700 whitespace-nowrap',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right'
                      )}
                    >
                      {col.render ? col.render(value, row) : String(value ?? '-')}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
