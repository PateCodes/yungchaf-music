
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

function SuccessContent() {
    const searchParams = useSearchParams();
    const message = searchParams.get('message');
    const source = searchParams.get('source');

    let title = "Thank You for Your Support!";
    let description = "Your contribution has been successfully processed. Your support means the world and helps in creating more music.";

    if (source === 'mpesa' && message) {
        title = "Action Required!";
        description = message;
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
            >
                <Card className="w-full max-w-lg text-center shadow-2xl">
                    <CardHeader>
                         <div className='flex justify-center mb-4'>
                            <div className='p-4 bg-green-100 dark:bg-green-900/20 rounded-full'>
                                <CheckCircle2 className="h-10 w-10 text-green-500" />
                            </div>
                        </div>
                        <CardTitle className="font-headline text-3xl">{title}</CardTitle>
                        <CardDescription className="text-lg pt-2">
                           {description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Button asChild size="lg">
                            <Link href="/music">Explore More Music</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
