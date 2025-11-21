
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CancelPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md text-center shadow-2xl">
          <CardHeader>
            <div className='flex justify-center mb-4'>
                <div className='p-4 bg-red-100 dark:bg-red-900/20 rounded-full'>
                    <XCircle className="h-10 w-10 text-destructive" />
                </div>
            </div>
            <CardTitle className="font-headline text-3xl">Payment Canceled</CardTitle>
            <CardDescription className="text-lg pt-2">
              Your contribution process was canceled. You have not been charged.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground">
                If you'd like to try again, you can return to the support page.
            </p>
            <Button asChild>
              <Link href="/support">Back to Support Page</Link>
            </Button>
            <Button asChild variant="ghost">
                <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
