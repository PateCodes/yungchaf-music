
"use client";

import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HandCoins, HeartHandshake, Gift, CreditCard, Phone } from 'lucide-react';
import { SiPaypal } from '@icons-pack/react-simple-icons';
import { FaMoneyBillWave } from 'react-icons/fa';
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { handleMpesaPayment } from "@/app/actions/mpesa";

// Data structure for payment methods from Firestore
interface PaymentMethod {
  id: string;
  name: string;
  currencies: string[];
  active: boolean;
  providerId: string;
}

// Map provider IDs to icons
const providerIcons: { [key: string]: React.ElementType } = {
    mpesa: FaMoneyBillWave,
    airtelmoney: FaMoneyBillWave,
    paypal: SiPaypal,
    stripe: CreditCard,
};

// Form schema for contribution dialog
const ContributionFormSchema = z.object({
    amount: z.coerce.number().positive('Amount must be greater than 0.'),
    currency: z.string().min(1, 'Please select a currency.'),
    phoneNumber: z.string().optional(),
});

// Contribution Form Component (inside the dialog)
const ContributionForm = ({ method, user, onFinished }: { method: PaymentMethod, user: any, onFinished: () => void }) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof ContributionFormSchema>>({
        resolver: zodResolver(ContributionFormSchema),
        defaultValues: {
            amount: 1, // Sandbox recommended value
            currency: method.currencies[0] || '',
            phoneNumber: '',
        },
    });

    const isMobileMoney = method.providerId === 'mpesa' || method.providerId === 'airtelmoney';

    async function onSubmit(values: z.infer<typeof ContributionFormSchema>) {
        if (!user) return;

        if (isMobileMoney && !values.phoneNumber) {
            form.setError('phoneNumber', { type: 'manual', message: 'Phone number is required for this method.' });
            return;
        }

        setIsSubmitting(true);
        
        try {
            if (isMobileMoney) {
                 const result = await handleMpesaPayment({
                    fanId: user.uid,
                    amount: values.amount,
                    currency: values.currency,
                    methodId: method.id,
                    phone: values.phoneNumber!,
                 });

                 if (result.success) {
                     toast({
                        title: 'Check Your Phone',
                        description: result.message,
                    });
                    onFinished();
                 } else {
                     throw new Error(result.error || 'Failed to initiate M-Pesa payment.');
                 }
            } else {
                // Handle other payment methods like Stripe and PayPal
                const isStripeOrPaypal = method.providerId === 'stripe' || method.providerId === 'paypal';
                if(isStripeOrPaypal) {
                    const apiRoute = `/api/payments/${method.providerId}`;
                    const params = new URLSearchParams({
                        fanId: user.uid,
                        amount: values.amount.toString(),
                        currency: values.currency,
                        methodId: method.id,
                    });
                    window.location.href = `${apiRoute}?${params.toString()}`;
                    return; // Redirect will happen, no further client-side action needed.
                }
                 throw new Error(`Payment provider "${method.providerId}" is not yet supported.`);
            }

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || `Could not initiate contribution with ${method.name}.`,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {method.currencies.length > 1 ? (
                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a currency" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {method.currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : <Input type="hidden" {...form.register('currency')} />}

                {isMobileMoney && (
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                 <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <FormControl>
                                        <Input type="tel" placeholder="e.g. 254712345678" className="pl-10" {...field} />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                 <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Proceed'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};

// Payment Method Card Component
const PaymentMethodCard = ({ method, index }: { method: PaymentMethod, index: number }) => {
    const { user } = useUser();
    const [dialogOpen, setDialogOpen] = useState(false);
    const Icon = providerIcons[method.providerId] || HandCoins;

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
            >
                <Card className="flex flex-col text-center items-center shadow-lg hover:shadow-primary/20 hover:border-primary/50 transition-all duration-300 h-full">
                    <CardHeader className="items-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-2">
                             <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>{method.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="flex flex-wrap gap-2 justify-center">
                            {method.currencies.map(currency => (
                                <div key={currency} className="text-sm font-medium border rounded-full px-3 py-1 bg-secondary text-secondary-foreground">{currency}</div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="w-full">
                        <DialogTrigger asChild>
                            <Button className="w-full" disabled={!user}>
                                {user ? 'Contribute' : 'Sign in to Contribute'}
                            </Button>
                        </DialogTrigger>
                    </CardFooter>
                </Card>
            </motion.div>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>Contribute with {method.name}</DialogTitle>
                    <DialogDescription>
                        Enter your contribution amount. You will be redirected to complete the payment securely.
                    </DialogDescription>
                </DialogHeader>
                {user ? (
                    <ContributionForm method={method} user={user} onFinished={() => setDialogOpen(false)} />
                ) : (
                    <p className="text-center text-muted-foreground py-4">Please sign in to make a contribution.</p>
                )}
            </DialogContent>
        </Dialog>
    )
}

// Main Support Page Component
export default function SupportPage() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  const paymentMethodsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, "paymentMethods"), where("active", "==", true)) : null,
    [firestore]
  );
  
  const { data: paymentMethods, isLoading } = useCollection<PaymentMethod>(paymentMethodsQuery);
  const effectiveLoading = isLoading || isUserLoading;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <HeartHandshake className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold mb-4 font-headline mt-4">Support the Music</h1>
        <p className="mb-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Your contributions help fuel the creation of new music. Thank you for being a part of this journey.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-6 text-center font-headline">Contribution Methods</h2>
        {effectiveLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        ) : paymentMethods && paymentMethods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentMethods.map((method, index) => (
              <PaymentMethodCard key={method.id} method={method} index={index}/>
            ))}
          </div>
        ) : (
          <Card className="text-center p-8">
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription className="mt-2">
              No active contribution methods found. Please check back later!
            </CardDescription>
          </Card>
        )}
      </section>
      
      <section className="mt-16 text-center">
        <h2 className="text-2xl font-semibold mb-3 font-headline">Other Ways to Support</h2>
        <p className="mb-4 text-muted-foreground">Sharing is caring! Help spread the word.</p>
        <div className="flex justify-center gap-4">
            <Button asChild>
                <Link href="/music">Share Music</Link>
            </Button>
             <Button asChild variant="secondary">
                <Link href="/refer" className="flex items-center gap-2">
                  <Gift className="h-4 w-4" /> Refer a Friend
                </Link>
            </Button>
        </div>
      </section>
    </div>
  );
}
