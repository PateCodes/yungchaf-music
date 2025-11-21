'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useMemo } from 'react';
import { format, startOfMonth, parse } from 'date-fns';

interface Fan {
  id: string;
  joinDate?: { seconds: number };
}

interface UserGrowthChartProps {
  fans: Fan[] | null;
}

const chartConfig = {
  newFans: {
    label: 'New Fans',
    color: 'hsl(var(--primary))',
  },
};

export function UserGrowthChart({ fans }: UserGrowthChartProps) {
  const chartData = useMemo(() => {
    if (!fans) return [];
    
    const monthlyTotals = fans.reduce((acc, fan) => {
      if (fan.joinDate) {
        const month = format(startOfMonth(new Date(fan.joinDate.seconds * 1000)), 'MMM yyyy');
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyTotals)
      .map(([month, newFans]) => ({ month, newFans }))
      .sort((a, b) => parse(a.month, 'MMM yyyy', new Date()).getTime() - parse(b.month, 'MMM yyyy', new Date()).getTime());

  }, [fans]);

  if (!chartData || chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-10">No fan sign-up data available.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Line dataKey="newFans" type="monotone" stroke="var(--color-newFans)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  );
}
