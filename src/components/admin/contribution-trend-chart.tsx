
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useMemo } from 'react';
import { format, startOfMonth } from 'date-fns';

interface Contribution {
  id: string;
  amount: number;
  timestamp?: { seconds: number };
}

interface ContributionTrendChartProps {
  contributions: Contribution[] | null;
}

const chartConfig = {
  amount: {
    label: 'Contributions',
    color: 'hsl(var(--primary))',
  },
};

export function ContributionTrendChart({ contributions }: ContributionTrendChartProps) {
  const chartData = useMemo(() => {
    if (!contributions) return [];
    
    const monthlyTotals = contributions.reduce((acc, c) => {
      if (c.timestamp) {
        const month = format(startOfMonth(new Date(c.timestamp.seconds * 1000)), 'MMM yyyy');
        acc[month] = (acc[month] || 0) + c.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyTotals)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  }, [contributions]);

  if (!chartData || chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-10">No contribution data available.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dashed" />}
        />
        <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
