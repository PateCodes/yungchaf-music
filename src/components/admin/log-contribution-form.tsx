
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HandCoins } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '../ui/skeleton';

interface Fan {
  id: string;
  username?: string;
}

interface LogContributionFormProps {
    fans: Fan[] | null;
}

const formSchema = z.object({
  fanId: z.string().min(1, 'Please select a fan.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  currency: z.enum(['KES', 'USD']),
  method: z.string().min(2, 'Method is required (e.g., M-Pesa, PayPal).'),
  paymentMethod: z.string().min(2, 'Payment Method is required (e.g., Manual).')
});

export function LogContributionForm({ fans }: LogContributionFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fanId: '',
      amount: 0,
      currency: 'KES',
      method: '',
      paymentMethod: 'manual'
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Could not connect to the database.',
      });
      return;
    }
    setIsSubmitting(true);
    const contributionsCol = collection(firestore, 'contributions');
    const newContribution = {
      ...values,
      status: 'completed' as const,
      timestamp: serverTimestamp(),
    };

    try {
        await addDocumentNonBlocking(contributionsCol, newContribution);
        toast({
            title: 'Contribution Logged!',
            description: 'The new contribution has been saved.',
        });
        form.reset({ fanId: '', amount: 0, currency: 'KES', method: '', paymentMethod: 'manual' });
    } catch(e: any) {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: e.message || 'Could not log contribution.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><HandCoins /> Log a Contribution</CardTitle>
            <CardDescription>Manually record a new contribution from a fan.</CardDescription>
        </CardHeader>
        <CardContent>
             {!fans ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
             ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fanId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Fan</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a fan" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {fans.map(fan => (
                                        <SelectItem key={fan.id} value={fan.id}>
                                            {fan.username || fan.id}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className='grid grid-cols-3 gap-2'>
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem className='col-span-2'>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 500" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                     <FormItem>
                                        <FormLabel>Currency</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Curr." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="KES">KES</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="method"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Method</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., M-Pesa" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., manual" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Logging...' : 'Log Contribution'}
                        </Button>
                    </form>
                </Form>
             )}
        </CardContent>
    </Card>
  );
}
