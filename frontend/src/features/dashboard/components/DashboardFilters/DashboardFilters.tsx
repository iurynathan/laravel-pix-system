import React from 'react';
import type { PixFilters } from '@/features/dashboard/types';
import { Button } from '@/components/atoms';
import {
  RotateCcw,
  Search,
  Calendar,
  DollarSign,
  Filter,
  ArrowUpDown,
} from 'lucide-react';

interface DashboardFiltersProps {
  filters: PixFilters;
  onFilterChange: (filters: Partial<PixFilters>) => void;
  onResetFilters: () => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    onFilterChange({ [e.target.name]: e.target.value });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let cleanValue = value.replace(/[^\d,]/g, '');

    const parts = cleanValue.split(',');
    if (parts.length > 2) {
      cleanValue = parts[0] + ',' + parts.slice(1).join('');
    }

    if (parts[1] && parts[1].length > 2) {
      cleanValue = parts[0] + ',' + parts[1].slice(0, 2);
    }

    onFilterChange({ [name]: cleanValue });
  };

  const handleSortDirectionToggle = () => {
    onFilterChange({
      sort_direction: filters.sort_direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSortDirectionToggle}
              className="flex items-center space-x-1"
              aria-label="Inverter ordem"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span>
                {filters.sort_direction === 'asc' ? 'Crescente' : 'Decrescente'}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="flex items-center gap-2"
              aria-label="Resetar filtros"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Busca Principal */}
          <div className="relative">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <Search className="inline h-4 w-4 mr-1" />
              Buscar por Token ou Descrição
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                name="search"
                placeholder="Digite o token ou descrição do PIX..."
                value={filters.search || ''}
                onChange={handleInputChange}
                className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
              />
            </div>
          </div>

          {/* Filtros em Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro de Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status || ''}
                onChange={handleInputChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
              >
                <option value="">Todos os status</option>
                <option value="generated">🟡 Pendente</option>
                <option value="paid">🟢 Pago</option>
                <option value="expired">🔴 Expirado</option>
              </select>
            </div>

            {/* Ordenação */}
            <div>
              <label
                htmlFor="sort_by"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Ordenar por
              </label>
              <select
                id="sort_by"
                name="sort_by"
                value={filters.sort_by || 'created_at'}
                onChange={handleInputChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
              >
                <option value="created_at">📅 Data de Criação</option>
                <option value="amount">💰 Valor</option>
                <option value="status">🔄 Status</option>
              </select>
            </div>

            {/* Data Início */}
            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <Calendar className="inline h-4 w-4 mr-1" />
                Data Inicial
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={filters.start_date || ''}
                onChange={handleInputChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label
                htmlFor="end_date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <Calendar className="inline h-4 w-4 mr-1" />
                Data Final
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={filters.end_date || ''}
                onChange={handleInputChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
              />
            </div>
          </div>

          {/* Filtros de Valor */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center mb-3">
              <DollarSign className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm font-medium text-gray-700">
                Faixa de Valores
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="min_value"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Valor Mínimo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    R$
                  </span>
                  <input
                    type="text"
                    id="min_value"
                    name="min_value"
                    placeholder="0,00"
                    value={filters.min_value}
                    onChange={handleValueChange}
                    className="pl-8 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="max_value"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Valor Máximo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    R$
                  </span>
                  <input
                    type="text"
                    id="max_value"
                    name="max_value"
                    placeholder="10.000,00"
                    value={filters.max_value}
                    onChange={handleValueChange}
                    className="pl-8 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
