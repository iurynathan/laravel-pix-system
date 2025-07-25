import { formatNumber } from '@/utils/formatters';
import { Card } from '@/components/molecules';

interface PixStatsCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'gray';
  icon?: string;
}

const colorClasses = {
  blue: 'border-blue-200 bg-blue-50',
  green: 'border-green-200 bg-green-50',
  red: 'border-red-200 bg-red-50',
  gray: 'border-gray-200 bg-gray-50',
};

const textColorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  gray: 'text-gray-600',
};

export function PixStatsCard({ title, value, color }: PixStatsCardProps) {
  return (
    <Card
      data-testid="stats-card"
      className={`${colorClasses[color]} border-2`}
    >
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
        <p className={`text-2xl font-bold ${textColorClasses[color]}`}>
          {formatNumber(value)}
        </p>
      </div>
    </Card>
  );
}
