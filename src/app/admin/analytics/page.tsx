
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { UserGrowthChart } from '@/components/admin/analytics/user-growth-chart';
import { TopFansList } from '@/components/admin/analytics/top-fans-list';
import { useAdminData } from '@/context/AdminDataContext';


const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AnalyticsPage() {
  const { fans, likes, comments } = useAdminData();

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
        Fan Analytics
      </motion.h1>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={cardVariants} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>New Fan Growth</CardTitle>
              <CardDescription>Tracks the number of new fans joining over time.</CardDescription>
            </CardHeader>
            <CardContent>
              {!fans ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <UserGrowthChart fans={fans} />
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={cardVariants}>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Top Fans</CardTitle>
              <CardDescription>Most active fans by likes and comments.</CardDescription>
            </CardHeader>
            <CardContent>
             {!fans || !likes || !comments ? (
              <div className='space-y-4'>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <TopFansList fans={fans} likes={likes} comments={comments} />
            )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
