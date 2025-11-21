
'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useMemo } from 'react';
import { format, startOfMonth } from 'date-fns';

interface Like {
  likeDate?: { seconds: number };
}
interface Comment {
  commentDate?: { seconds: number };
}
interface FanEngagementChartProps {
    likes: Like[] | null;
    comments: Comment[] | null;
}

const chartConfig = {
  likes: {
    label: 'Likes',
    color: 'hsl(var(--chart-1))',
  },
  comments: {
    label: 'Comments',
    color: 'hsl(var(--chart-2))',
  },
};

export function FanEngagementChart({ likes, comments }: FanEngagementChartProps) {
  const chartData = useMemo(() => {
    const monthlyData: Record<string, { likes: number, comments: number }> = {};
    
    const processData = (items: Like[] | Comment[] | null, type: 'likes' | 'comments') => {
        if (!items) return;
        items.forEach(item => {
            const date = type === 'likes' ? (item as Like).likeDate : (item as Comment).commentDate;
            if (date) {
                const month = format(startOfMonth(new Date(date.seconds * 1000)), 'MMM yyyy');
                if (!monthlyData[month]) monthlyData[month] = { likes: 0, comments: 0 };
                monthlyData[month][type]++;
            }
        });
    };

    processData(likes, 'likes');
    processData(comments, 'comments');
    
    return Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  }, [likes, comments]);

  if (!chartData || chartData.length === 0) {
    return <div className="text-center text-muted-foreground py-10">No engagement data available.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillLikes" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-likes)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-likes)"
              stopOpacity={0.1}
            />
          </linearGradient>
          <linearGradient id="fillComments" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-comments)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-comments)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="comments"
          type="natural"
          fill="url(#fillComments)"
          stroke="var(--color-comments)"
          stackId="a"
        />
        <Area
          dataKey="likes"
          type="natural"
          fill="url(#fillLikes)"
          stroke="var(--color-likes)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
}
