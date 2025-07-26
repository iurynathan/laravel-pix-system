import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { AppLayout } from '@/components/templates';
import { Button } from '@/components/atoms';
import {
  DashboardFilters,
  PixStatsCard,
  PixChartRecharts,
  PixTimelineChart,
  PixVirtualList,
} from '@/features/dashboard/components';
import { useDashboard } from '@/features/dashboard/hooks';
import { usePixContext } from '@/context';
import { Plus, RefreshCw } from 'lucide-react';
import type { PixFilters } from '@/features/dashboard/types';

export function DashboardPage() {
  const {
    pixList,
    loading: pixLoading,
    pagination,
    filters,
    fetchPixList,
    updateFilters,
    refreshPixList,
  } = usePixContext();

  const {
    statistics,
    loading: statsLoading,
    error: statsError,
    loadStatistics,
  } = useDashboard();

  const [debouncedFilters] = useDebounce(filters, 500);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchPixList(1);
    loadStatistics(debouncedFilters, isInitialRender);

    if (isInitialRender) {
      setIsInitialRender(false);
    }
  }, [debouncedFilters, fetchPixList, loadStatistics, isInitialRender]);

  const handlePageChange = (page: number) => {
    fetchPixList(page);
  };

  const handleFilterChange = (newFilters: Partial<PixFilters>) => {
    updateFilters(newFilters);
  };

  const handleResetFilters = () => {
    updateFilters({
      status: '',
      search: '',
      start_date: '',
      end_date: '',
      min_value: '',
      max_value: '',
      sort_by: 'created_at',
      sort_direction: 'desc',
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshPixList(), loadStatistics(filters, false)]);
    } finally {
      setIsRefreshing(false);
    }
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard PIX</h1>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center space-x-2"
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
            </Button>
            <Link to="/pix/create">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Criar PIX
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <DashboardFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PixStatsCard
            title="Total de PIX"
            value={statistics?.total_pix || 0}
            color="blue"
          />
          <PixStatsCard
            title="Pendentes"
            value={statistics?.generated || 0}
            color="yellow"
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

        {/* Gráfico de Pizza - Distribuição por Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PixChartRecharts
            data={statistics}
            type="pie"
            title="Distribuição de PIX por Status"
          />

          {/* Card com resumo do valor total por período */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Resumo de Valores
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Processado</span>
                <span className="text-lg font-bold text-green-600">
                  {statistics?.total_amount
                    ? new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(statistics.total_amount)
                    : 'R$ 0,00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taxa de Conversão</span>
                <span className="text-lg font-bold text-blue-600">
                  {statistics && statistics.total_pix > 0
                    ? Math.round((statistics.paid / statistics.total_pix) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">PIX por Status</span>
                <div className="text-sm space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Pagos: {statistics?.paid || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Pendentes: {statistics?.generated || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Expirados: {statistics?.expired || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Chart - Evolução dos PIX nos últimos 30 dias */}
        <div className="grid grid-cols-1 gap-6">
          <PixTimelineChart days={30} />
        </div>

        {/* PIX List com Virtual Scrolling */}
        <PixVirtualList
          pixList={pixList}
          loading={pixLoading}
          pagination={pagination}
          onPageChange={handlePageChange}
          height={600}
          itemHeight={80}
        />
      </div>
    </AppLayout>
  );
}
