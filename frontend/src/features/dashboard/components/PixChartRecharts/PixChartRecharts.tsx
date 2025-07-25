import { memo, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/molecules';
import type { PixStatistics } from '@/types/pix';

interface PixChartRechartsProps {
  data: PixStatistics | null;
  title?: string;
  type?: 'pie' | 'bar';
}

const statusLabels: Record<string, string> = {
  generated: 'Pendentes',
  paid: 'Pagos',
  expired: 'Expirados',
};

const COLORS = {
  generated: '#FBBF24', // yellow
  paid: '#10B981', // green
  expired: '#EF4444', // red
};

const PixChartRecharts = memo<PixChartRechartsProps>(
  ({ data, title = 'Status dos PIX', type = 'pie' }) => {
    const chartData = useMemo(() => {
      if (!data) return [];

      return [
        {
          status: 'generated',
          name: statusLabels.generated,
          value: data.generated || 0,
          color: COLORS.generated,
        },
        {
          status: 'paid',
          name: statusLabels.paid,
          value: data.paid || 0,
          color: COLORS.paid,
        },
        {
          status: 'expired',
          name: statusLabels.expired,
          value: data.expired || 0,
          color: COLORS.expired,
        },
      ].filter(item => item.value > 0);
    }, [data]);

    const total = useMemo(() => {
      return chartData.reduce((sum, item) => sum + item.value, 0);
    }, [chartData]);

    if (!data || chartData.length === 0) {
      return (
        <Card data-testid="pix-chart-recharts">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <p className="text-gray-500 text-center py-8">
            Nenhum dado disponível
          </p>
        </Card>
      );
    }

    const renderTooltip = ({ active, payload }: any) => {
      if (active && payload && payload[0]) {
        const data = payload[0].payload;
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-medium">{data.name}</p>
            <p className="text-sm text-gray-600">
              Quantidade: <span className="font-semibold">{data.value}</span>
            </p>
            <p className="text-sm text-gray-600">
              Percentual:{' '}
              <span className="font-semibold">
                {((data.value / total) * 100).toFixed(1)}%
              </span>
            </p>
          </div>
        );
      }
      return null;
    };

    const renderPieChart = () => (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={renderTooltip} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }}>
                {value}: {entry.payload.value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    );

    const renderBarChart = () => (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={renderTooltip} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );

    return (
      <Card data-testid="pix-chart-recharts">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-gray-600">
            Total de PIX: <span className="font-semibold">{total}</span>
          </p>
        </div>

        {type === 'pie' ? renderPieChart() : renderBarChart()}

        {/* Status summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {chartData.map(item => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={item.status} className="text-center">
                <div
                  className="w-4 h-4 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-600">
                  {item.value} ({percentage}%)
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }
);

PixChartRecharts.displayName = 'PixChartRecharts';

export { PixChartRecharts };
