import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { PixPayment } from '@/types/pix';

interface PixListProps {
  pixList: PixPayment[];
  loading: boolean;
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  } | null;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onStatusFilter: (status: string) => void;
}

const statusLabels = {
  generated: 'Aguardando',
  paid: 'Pago',
  expired: 'Expirado',
};

const statusColors = {
  generated: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
};

export function PixList({
  pixList = [],
  loading,
  pagination,
  onRefresh,
  onPageChange,
  onStatusFilter,
}: PixListProps) {
  // Garantir que pixList seja sempre um array
  const safePixList = Array.isArray(pixList) ? pixList : [];
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Carregando...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Lista de PIX</h2>

        <div className="flex items-center space-x-4">
          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Filtrar por status
            </label>
            <select
              id="status-filter"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={e => onStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="generated">Aguardando</option>
              <option value="paid">Pago</option>
              <option value="expired">Expirado</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {safePixList.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum PIX encontrado</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {safePixList.map(pix => (
                  <tr key={pix.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {pix.token.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pix.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(pix.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[pix.status]}`}
                      >
                        {statusLabels[pix.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(pix.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>
                  Página {pagination.currentPage} de {pagination.lastPage}
                </span>
                <span>Total: {pagination.total} PIX</span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="flex items-center space-x-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.lastPage}
                  className="flex items-center space-x-1"
                >
                  <span>Próxima</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
