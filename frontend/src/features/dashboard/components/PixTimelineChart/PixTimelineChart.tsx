import { memo, useMemo, useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/molecules';
import { formatDateOnly } from '@/utils/formatters';
import { pixService } from '@/services/pix';

interface TimelineData {
  date: string;
  generated: number;
  paid: number;
  expired: number;
  total: number;
  amount: number;
}

interface PixTimelineChartProps {
  title?: string;
  days?: number;
}

const PixTimelineChart = memo<PixTimelineChartProps>(
  ({ title = 'PIX ao Longo do Tempo', days = 30 }) => {
    const [data, setData] = useState<TimelineData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchTimelineData = async () => {
        try {
          setLoading(true);
          const timelineData = await pixService.getTimeline(days);
          setData(timelineData);
        } catch (error) {
          console.error('Erro ao buscar dados temporais:', error);
          setData([]);
        } finally {
          setLoading(false);
        }
      };

      fetchTimelineData();
    }, [days]);

    const chartData = useMemo(() => {
      return data.map(item => ({
        ...item,
        date: formatDateOnly(item.date),
      }));
    }, [data]);

    const renderTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-medium mb-2">{label}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}:{' '}
                <span className="font-semibold">{entry.value}</span>
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    if (loading) {
      return (
        <Card data-testid="pix-timeline-chart">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      );
    }

    if (!data || data.length === 0) {
      return (
        <Card data-testid="pix-timeline-chart">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <p className="text-gray-500 text-center py-8">
            Nenhum dado temporal disponível
          </p>
        </Card>
      );
    }

    return (
      <Card data-testid="pix-timeline-chart">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-gray-600">
            Evolução dos PIX nos últimos {data.length} dias
          </p>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={11}
              tick={{ fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
              allowDecimals={false}
            />
            <Tooltip content={renderTooltip} />
            <Legend />

            <Line
              type="monotone"
              dataKey="paid"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
              activeDot={{
                r: 7,
                stroke: '#10B981',
                strokeWidth: 2,
                fill: '#fff',
              }}
              name="Pagos"
              connectNulls={false}
            />

            <Line
              type="monotone"
              dataKey="expired"
              stroke="#EF4444"
              strokeWidth={3}
              dot={{ fill: '#EF4444', strokeWidth: 2, r: 5 }}
              activeDot={{
                r: 7,
                stroke: '#EF4444',
                strokeWidth: 2,
                fill: '#fff',
              }}
              name="Expirados"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          {[
            { key: 'paid', label: 'Pagos', color: '#10B981' },
            { key: 'expired', label: 'Expirados', color: '#EF4444' },
          ].map(stat => {
            const total = data.reduce(
              (sum, day) =>
                sum + (day[stat.key as keyof TimelineData] as number),
              0
            );
            const avg = Math.round(total / data.length);

            return (
              <div key={stat.key} className="text-center">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: stat.color }}
                />
                <p className="text-sm font-medium">{stat.label}</p>
                <p className="text-xs text-gray-600">
                  Total: {total} | Média: {avg}/dia
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }
);

PixTimelineChart.displayName = 'PixTimelineChart';

export { PixTimelineChart };
export type { TimelineData, PixTimelineChartProps };
