
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, DollarSign, Heart, MessageSquare, HandCoins } from 'lucide-react';
import { FanEngagementChart } from '@/components/admin/fan-engagement-chart';
import { ContributionTrendChart } from '@/components/admin/contribution-trend-chart';
import { LogContributionForm } from '@/components/admin/log-contribution-form';
import { useMemo } from 'react';
import { ActivityFeed } from '@/components/admin/activity-feed';
import { motion } from 'framer-motion';
import { useAdminData } from '@/context/AdminDataContext';


const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const StatCard = ({ title, value, icon: Icon, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean }) => (
   <motion.div variants={cardVariants}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{value}</div>}
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
   </motion.div>
);


export default function AdminDashboardPage() {
  const { fans, contributions, likes, comments, messages } = useAdminData();

  const isLoading = !fans || !contributions || !likes || !comments || !messages;

  const totalContributions = useMemo(() => {
    if (!contributions) return { KES: 0, USD: 0 };
    return contributions.reduce((acc, c) => {
        if(c.status === 'completed') {
            acc[c.currency] = (acc[c.currency] || 0) + c.amount;
        }
        return acc;
    }, {} as Record<'KES' | 'USD', number>);
  }, [contributions]);

  const validComments = useMemo(() => {
    return comments ? comments.filter(comment => !!comment.musicId) : [];
  }, [comments]);

  const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
        },
    },
  };

  return (
    <div className='flex flex-col gap-6'>
      <motion.h1 
        className="text-3xl font-bold tracking-tight"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Dashboard Overview
      </motion.h1>

      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <StatCard title="Total Fans" value={fans?.length ?? 0} icon={Users} description="Number of signed-up users." isLoading={isLoading} />
        <StatCard title="Total Likes" value={likes?.length ?? 0} icon={Heart} description="Across all music tracks." isLoading={isLoading} />
        <StatCard title="Total Comments" value={comments?.length ?? 0} icon={MessageSquare} description="Across all music tracks." isLoading={isLoading} />
        <StatCard title="Contributions (KES)" value={formatCurrency(totalContributions.KES || 0, 'KES')} icon={HandCoins} description="Total from M-Pesa, etc." isLoading={isLoading} />
        <StatCard title="Contributions (USD)" value={formatCurrency(totalContributions.USD || 0, 'USD')} icon={DollarSign} description="Total from PayPal, etc." isLoading={isLoading} />
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fan Engagement</CardTitle>
            <CardDescription>Monthly likes and comments.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <FanEngagementChart likes={likes} comments={comments} />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contribution Trend</CardTitle>
            <CardDescription>Monthly contribution totals.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ContributionTrendChart contributions={contributions} />
            )}
          </CardContent>
        </Card>
      </motion.div>

       <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
       >
         <Card className="lg:col-span-1">
            <LogContributionForm fans={fans} />
         </Card>
         <div className="lg:col-span-2">
            <ActivityFeed 
                comments={validComments} 
                messages={messages} 
                fans={fans} 
                isLoading={isLoading} 
            />
         </div>
      </motion.div>
    </div>
  );
}
