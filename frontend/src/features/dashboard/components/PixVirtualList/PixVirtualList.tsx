import { memo, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { PixPayment } from '@/types/pix';

interface PixVirtualListProps {
  pixList: PixPayment[];
  loading: boolean;
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  } | null;
  onPageChange: (page: number) => void;
  height?: number;
  itemHeight?: number;
}

const statusLabels = {
  generated: 'Pendente',
  paid: 'Pago',
  expired: 'Expirado',
} as const;

const statusColors = {
  generated: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
} as const;

interface PixListItemProps {
  index: number;
  style: React.CSSProperties;
  data: PixPayment[];
}

const PixListItem = memo<PixListItemProps>(({ index, style, data }) => {
  const pix = data[index];

  if (!pix) {
    return (
      <div
        style={style}
        className="flex items-center border-b border-gray-200 px-6"
      >
        <div
          className="animate-pulse flex space-x-4"
          style={{ minWidth: '800px' }}
        >
          <div className="rounded bg-gray-200 h-4 w-20"></div>
          <div className="rounded bg-gray-200 h-4 w-32"></div>
          <div className="rounded bg-gray-200 h-4 w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={`/pix/details/${pix.id}`}
      style={style}
      className="flex items-center border-b border-gray-200 hover:bg-gray-50"
    >
      <div
        className={`grid gap-4 items-center px-6 py-4 ${pix.user ? 'grid-cols-6' : 'grid-cols-5'}`}
        style={{ minWidth: '800px' }}
      >
        <div className="font-mono text-sm text-gray-900 truncate">
          {pix.token}
        </div>

        <div className="text-sm text-gray-900 truncate">
          {pix.description || '-'}
        </div>

        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(pix.amount)}
        </div>

        <div>
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              statusColors[pix.status as keyof typeof statusColors]
            }`}
          >
            {statusLabels[pix.status as keyof typeof statusLabels]}
          </span>
        </div>

        {pix.user && (
          <div className="text-sm text-gray-600 truncate">
            <div className="font-medium">{pix.user.name}</div>
            <div className="text-xs text-gray-400">{pix.user.email}</div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          {formatDate(pix.created_at)}
        </div>
      </div>
    </Link>
  );
});

PixListItem.displayName = 'PixListItem';

const PixVirtualList = memo<PixVirtualListProps>(
  ({
    pixList = [],
    loading,
    pagination,
    onPageChange,
    height = 600,
    itemHeight = 80,
  }) => {
    const safePixList = Array.isArray(pixList) ? pixList : [];

    const handlePreviousPage = useCallback(() => {
      if (pagination && pagination.currentPage > 1) {
        onPageChange(pagination.currentPage - 1);
      }
    }, [pagination, onPageChange]);

    const handleNextPage = useCallback(() => {
      if (pagination && pagination.currentPage < pagination.lastPage) {
        onPageChange(pagination.currentPage + 1);
      }
    }, [pagination, onPageChange]);

    const listData = useMemo(() => safePixList, [safePixList]);

    if (loading) {
      return (
        <Card>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Carregando...</p>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Lista de PIX</h2>
        </div>

        {safePixList.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum PIX encontrado</p>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
              <div style={{ minWidth: '800px' }}>
                {/* Header da tabela */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <div
                    className={`grid gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      safePixList.some(pix => pix.user)
                        ? 'grid-cols-6'
                        : 'grid-cols-5'
                    }`}
                  >
                    <div>Token</div>
                    <div>Descrição</div>
                    <div>Valor</div>
                    <div>Status</div>
                    {safePixList.some(pix => pix.user) && <div>Usuário</div>}
                    <div>Data</div>
                  </div>
                </div>

                {/* Lista virtualizada */}
                <div className="border-b border-gray-200">
                  <List
                    height={Math.min(height, safePixList.length * itemHeight)}
                    itemCount={safePixList.length}
                    itemSize={itemHeight}
                    itemData={listData}
                    width="100%"
                  >
                    {PixListItem}
                  </List>
                </div>
              </div>
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
                    onClick={handlePreviousPage}
                    disabled={pagination.currentPage === 1}
                    className="flex items-center space-x-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Anterior</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
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
);

PixVirtualList.displayName = 'PixVirtualList';

export { PixVirtualList };
export type { PixVirtualListProps };
