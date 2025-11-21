
'use client';

import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Label } from '@/components/ui/label';

// Data Interface
interface PaymentMethod {
  id: string;
  name: string;
  currencies: string[];
  active: boolean;
  providerId: string;
}

// Validation Schema for the forms
const formSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  providerId: z.string().min(2, 'Provider ID is required (e.g., mpesa, stripe, paypal).'),
  currencies: z.string().min(2, 'Currencies are required (comma-separated, e.g., KES,USD).'),
});

// Edit/Create Form Component
const MethodForm = ({ method, onFinished, isCreate = false }: { method?: PaymentMethod, onFinished: () => void, isCreate?: boolean }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: method?.name || '',
      providerId: method?.providerId || '',
      currencies: method?.currencies.join(',') || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);
    
    const dataToSave = {
        name: values.name,
        providerId: values.providerId,
        currencies: values.currencies.split(',').map(c => c.trim().toUpperCase()),
        active: method?.active ?? true, // Default to true on creation
    };

    if (isCreate) {
        const methodsCol = collection(firestore, 'paymentMethods');
        addDocumentNonBlocking(methodsCol, dataToSave);
         toast({
            title: 'Payment Method Created',
            description: `The ${values.name} method has been added.`,
        });
    } else if(method) {
        const methodRef = doc(firestore, 'paymentMethods', method.id);
        updateDocumentNonBlocking(methodRef, dataToSave);
        toast({
            title: 'Payment Method Updated',
            description: `The details for ${values.name} have been saved.`,
        });
    }
    setIsSubmitting(false);
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input placeholder="e.g., Credit Card" {...field} /></FormControl>
              <FormDescription>The display name for the payment method.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="providerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider ID</FormLabel>
              <FormControl><Input placeholder="stripe" {...field} /></FormControl>
              <FormDescription>Must be a specific ID: 'stripe', 'paypal', or 'mpesa'.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currencies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currencies</FormLabel>
              <FormControl><Input placeholder="KES,USD" {...field} /></FormControl>
              <FormDescription>Comma-separated list of supported currencies (e.g., KES, USD).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter className="sticky bottom-0 bg-background pt-4">
          <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}


// Main Page Component
export default function AdminPaymentsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const methodsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'paymentMethods')) : null),
    [firestore]
  );
  const { data: paymentMethods, isLoading } = useCollection<PaymentMethod>(methodsQuery);

  const handleToggleActive = (method: PaymentMethod) => {
    if (!firestore) return;
    const methodRef = doc(firestore, 'paymentMethods', method.id);
    const newStatus = !method.active;
    updateDocumentNonBlocking(methodRef, { active: newStatus });
    toast({
      title: `${method.name} ${newStatus ? 'Enabled' : 'Disabled'}`,
      description: `This payment method is now ${newStatus ? 'visible' : 'hidden'} on the support page.`,
    });
  };

  const handleDelete = (methodId: string) => {
     if (!firestore) return;
     const methodRef = doc(firestore, 'paymentMethods', methodId);
     deleteDocumentNonBlocking(methodRef);
     toast({
      variant: 'destructive',
      title: 'Method Deleted',
      description: 'The payment method has been removed.',
    });
  }
  
  const setDialogState = (id: string, isOpen: boolean) => {
    setOpenDialogs(prev => ({ ...prev, [id]: isOpen }));
  }

  return (
    <div className="flex flex-col gap-6">
       <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage how fans can contribute. Enable, disable, or edit payment details.</CardDescription>
            </div>
             <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Method
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Payment Method</DialogTitle>
                      <DialogDescription>Add a new way for fans to contribute.</DialogDescription>
                    </DialogHeader>
                    <MethodForm onFinished={() => setIsCreateOpen(false)} isCreate={true} />
                </DialogContent>
            </Dialog>
        </CardHeader>
       </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
             <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
             </Card>
          ))
        ) : paymentMethods && paymentMethods.length > 0 ? (
          paymentMethods.map((method) => (
            <Card key={method.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{method.name}</CardTitle>
                <CardDescription>Provider ID: {method.providerId}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                 <div>
                    <h4 className="text-sm font-semibold">Supported Currencies:</h4>
                    <p className="text-sm text-muted-foreground">{method.currencies.join(', ')}</p>
                 </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center border-t pt-4 mt-4">
                <div className="flex items-center space-x-2">
                    <Switch
                        id={`active-switch-${method.id}`}
                        checked={method.active}
                        onCheckedChange={() => handleToggleActive(method)}
                    />
                    <Label htmlFor={`active-switch-${method.id}`} className="text-sm font-medium">
                        {method.active ? 'Active' : 'Inactive'}
                    </Label>
                </div>
                <div className="flex gap-1">
                    <Dialog open={openDialogs[method.id] || false} onOpenChange={(isOpen) => setDialogState(method.id, isOpen)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit: {method.name}</DialogTitle>
                          <DialogDescription>Update the details for this payment method.</DialogDescription>
                        </DialogHeader>
                        <MethodForm method={method} onFinished={() => setDialogState(method.id, false)} />
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete the {method.name} payment method. This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(method.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className='text-muted-foreground text-center col-span-full'>No payment methods found. Click "Create Method" to add one.</p>
        )}
      </div>
    </div>
  );
}
