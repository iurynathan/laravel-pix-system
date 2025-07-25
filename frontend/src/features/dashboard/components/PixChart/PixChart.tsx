import { Card } from '@/components/molecules';
import type { PixStatistics } from '@/types/pix';

interface ChartData {
  status: string;
  count: number;
  color: string;
}

interface PixChartProps {
  data: PixStatistics | null;
  title?: string;
}

const statusLabels: Record<string, string> = {
  generated: 'Gerados',
  paid: 'Pagos',
  expired: 'Expirados',
};

export function PixChart({ data, title = 'Status dos PIX' }: PixChartProps) {
  if (!data) {
    return (
      <Card data-testid="pix-chart">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
      </Card>
    );
  }

  const chartData: ChartData[] = [
    {
      status: 'generated',
      count: data.generated || 0,
      color: '#6B7280', // gray
    },
    {
      status: 'paid',
      count: data.paid || 0,
      color: '#10B981', // green
    },
    {
      status: 'expired',
      count: data.expired || 0,
      color: '#EF4444', // red
    },
  ].filter(item => item.count > 0);

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  if (chartData.length === 0) {
    return (
      <Card data-testid="pix-chart">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
      </Card>
    );
  }

  const maxCount = Math.max(...chartData.map(item => item.count));

  return (
    <Card data-testid="pix-chart">
      <h3 className="text-lg font-semibold mb-6">{title}</h3>

      {/* Chart bars */}
      <div className="space-y-3 mb-6">
        {chartData.map(item => {
          const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

          return (
            <div key={item.status} className="flex items-center">
              <div className="w-20 text-sm text-gray-600 mr-3">
                {statusLabels[item.status] || item.status}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  data-testid={`chart-bar-${item.status}`}
                  className="h-full rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <div className="w-12 text-right text-sm text-gray-700 ml-3">
                {item.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-2 text-sm">
        {chartData.map(item => (
          <div key={item.status} className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: item.color }}
            />
            <span>
              {statusLabels[item.status] || item.status}: {item.count}
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-gray-200 font-medium">
          Total: {total}
        </div>
      </div>
    </Card>
  );
}
