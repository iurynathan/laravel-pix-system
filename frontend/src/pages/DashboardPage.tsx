import { useEffect } from 'react';
import { AppLayout } from '@/components/templates';
import {
  PixStatsCard,
  PixChart,
  PixList,
} from '@/features/dashboard/components';
import { useDashboard } from '@/features/dashboard/hooks';
import { usePixContext } from '@/context';

export function DashboardPage() {
  const {
    statistics,
    loading: statsLoading,
    error: statsError,
  } = useDashboard();
  const {
    pixList,
    loading: pixLoading,
    pagination,
    fetchPixList,
    refreshPixList,
  } = usePixContext();

  // Carrega dados iniciais do PIX quando o componente montar
  useEffect(() => {
    fetchPixList();
  }, [fetchPixList]);

  const handlePageChange = (page: number) => {
    fetchPixList(page);
  };

  const handleStatusFilter = (status: string) => {
    fetchPixList(1, status || undefined);
  };

  const handleRefresh = () => {
    refreshPixList();
  };

  if (statsLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Carregando dashboard...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (statsError) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">
              Erro ao carregar dashboard
            </h3>
            <p className="text-red-600 text-sm mt-1">{statsError}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard PIX</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PixStatsCard
            title="Total de PIX"
            value={statistics?.total || 0}
            color="blue"
          />
          <PixStatsCard
            title="Aguardando"
            value={statistics?.generated || 0}
            color="gray"
          />
          <PixStatsCard
            title="Pagos"
            value={statistics?.paid || 0}
            color="green"
          />
          <PixStatsCard
            title="Expirados"
            value={statistics?.expired || 0}
            color="red"
          />
        </div>

        {/* Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PixChart data={statistics} />

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Valor Total</h3>
              <p className="text-3xl font-bold text-green-600">
                {statistics?.total_amount
                  ? new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(statistics.total_amount)
                  : 'R$ 0,00'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Taxa de Conversão</h3>
              <p className="text-3xl font-bold text-blue-600">
                {statistics && statistics.total > 0
                  ? Math.round((statistics.paid / statistics.total) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        {/* PIX List */}
        <PixList
          pixList={pixList}
          loading={pixLoading}
          pagination={pagination}
          onRefresh={handleRefresh}
          onPageChange={handlePageChange}
          onStatusFilter={handleStatusFilter}
        />
      </div>
    </AppLayout>
  );
}
