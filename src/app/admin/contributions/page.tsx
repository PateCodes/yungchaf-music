
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, CheckCircle, XCircle, Hourglass, Download, Search } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAdminData } from '@/context/AdminDataContext';


// Data Interfaces
interface Contribution {
  id: string;
  fanId: string;
  amount: number;
  currency: 'KES' | 'USD';
  method: string;
  timestamp?: { seconds: number };
  status: 'pending' | 'completed' | 'failed';
}

interface Fan {
  id: string;
  username?: string;
  email?: string;
  photoURL?: string;
}


// Validation Schema
const formSchema = z.object({
  fanId: z.string().min(1, 'Please select a fan.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  currency: z.enum(['KES', 'USD']),
  method: z.string().min(2, 'Method is required (e.g., M-Pesa, PayPal).'),
  status: z.enum(['pending', 'completed', 'failed']),
});

// Format Currency Utility
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};


// Edit Contribution Form Component
const EditContributionForm = ({ contribution, fans, onFinished }: { contribution: Contribution, fans: Fan[], onFinished: () => void }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fanId: contribution.fanId,
      amount: contribution.amount,
      currency: contribution.currency,
      method: contribution.method,
      status: contribution.status,
    },
  });

  const { formState } = form;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || contribution.id.startsWith('mock')) {
        toast({
            title: 'Mock Data',
            description: 'This is a mock entry and cannot be edited on the backend.',
        });
        onFinished();
        return;
    }
    setIsSubmitting(true);
    const contributionRef = doc(firestore, 'contributions', contribution.id);
    
    updateDocumentNonBlocking(contributionRef, values);
    toast({
      title: 'Contribution Updated',
      description: 'The contribution has been successfully updated.',
    });
    setIsSubmitting(false);
    onFinished();
  }

  return (
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
            name="status"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />

        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting || !formState.isDirty}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

const StatusBadge = ({ status }: { status: 'pending' | 'completed' | 'failed' }) => {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    completed: 'bg-green-100 text-green-800 border-green-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
  };
  const statusIcons = {
    pending: <Hourglass className="h-3 w-3" />,
    completed: <CheckCircle className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
  }

  return (
    <Badge variant="outline" className={cn('gap-1.5', statusStyles[status])}>
      {statusIcons[status]}
      <span className="capitalize">{status}</span>
    </Badge>
  );
};


// Main Page Component
export default function AdminContributionsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const { fans: fansData } = useAdminData();
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const contributionsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, "contributions"), orderBy('timestamp', 'desc')) : null),
    [firestore, user]
  );
  const { data: contributionsData } = useCollection<Contribution>(contributionsQuery);
  
  const contributions = contributionsData || [];
  const fans = fansData || [];

  const fansMap = useMemo(() => {
    return new Map(fans.map(fan => [fan.id, fan]));
  }, [fans]);

  const processedContributions = useMemo(() => {
    let filtered = [...contributions];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
        const lowercasedSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(c => {
            const fan = fansMap.get(c.fanId);
            return fan?.username?.toLowerCase().includes(lowercasedSearch) || fan?.email?.toLowerCase().includes(lowercasedSearch);
        });
    }
    
    return filtered;

  }, [contributions, statusFilter, searchTerm, fansMap]);
  
  const paginatedContributions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedContributions.slice(startIndex, startIndex + itemsPerPage);
  }, [processedContributions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedContributions.length / itemsPerPage);


  const handleDeleteContribution = (contributionId: string) => {
    if (!firestore) return;
     if (contributionId.startsWith('mock')) {
        toast({
            variant: 'destructive',
            title: 'Mock Data',
            description: 'This is a mock entry and cannot be deleted.',
        });
        return;
    }
    const contributionRef = doc(firestore, 'contributions', contributionId);
    deleteDocumentNonBlocking(contributionRef);
    toast({
      variant: 'destructive',
      title: 'Contribution Deleted',
      description: 'The contribution record has been removed.',
    });
  };
  
  const setDialogState = (id: string, isOpen: boolean) => {
    setOpenDialogs(prev => ({ ...prev, [id]: isOpen }));
  }

  const exportToCSV = () => {
    const headers = ['Fan Name', 'Date', 'Amount', 'Currency', 'Method', 'Status'];
    const rows = processedContributions.map(c => {
        const fan = fansMap.get(c.fanId);
        const date = c.timestamp ? format(new Date(c.timestamp.seconds * 1000), 'yyyy-MM-dd') : 'N/A';
        return [
            fan?.username || 'Unknown',
            date,
            c.amount,
            c.currency,
            c.method,
            c.status,
        ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "contributions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Fan Name", "Date", "Amount", "Currency", "Method", "Status"];
    const tableRows: any[][] = [];

    processedContributions.forEach(c => {
        const fan = fansMap.get(c.fanId);
        const date = c.timestamp ? format(new Date(c.timestamp.seconds * 1000), 'yyyy-MM-dd') : 'N/A';
        const contributionData = [
            fan?.username || 'Unknown',
            date,
            c.amount,
            c.currency,
            c.method,
            c.status,
        ];
        tableRows.push(contributionData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });
    doc.text("Contributions Report", 14, 15);
    doc.save("contributions.pdf");
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <CardTitle>Manage Contributions</CardTitle>
                    <CardDescription>
                    View, filter, edit, or delete all fan contributions.
                    </CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by fan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                     <Button variant="outline" onClick={exportToCSV} disabled={processedContributions.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        CSV
                    </Button>
                    <Button variant="outline" onClick={exportToPDF} disabled={processedContributions.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </div>
             <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)} className="mt-4">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
            </Tabs>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[65vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Fan</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!fansData || !contributionsData ? (
                  [...Array(8)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedContributions.length > 0 ? (
                  paginatedContributions.map((contribution) => {
                    const fan = fansMap.get(contribution.fanId);
                    return (
                        <TableRow key={contribution.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>
                                    {fan?.username
                                        ? fan.username.charAt(0).toUpperCase()
                                        : '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="font-medium">
                                    {fan?.username || 'Unknown Fan'}
                                </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {contribution.timestamp ? format(new Date(contribution.timestamp.seconds * 1000), 'PPP') : 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono font-semibold text-primary">
                                {formatCurrency(contribution.amount, contribution.currency)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {contribution.method}
                            </TableCell>
                             <TableCell>
                                <StatusBadge status={contribution.status} />
                            </TableCell>
                            <TableCell className="text-right">
                                <Dialog open={openDialogs[contribution.id] || false} onOpenChange={(isOpen) => setDialogState(contribution.id, isOpen)}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Contribution</DialogTitle>
                                      <DialogDescription>
                                        Update the details for this contribution record.
                                      </DialogDescription>
                                    </DialogHeader>
                                    {fans && <EditContributionForm contribution={contribution} fans={fans} onFinished={() => setDialogState(contribution.id, false)} />}
                                  </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className='text-destructive'>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this contribution record.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteContribution(contribution.id)} className="bg-destructive hover:bg-destructive/90">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
           <div className="flex items-center justify-end space-x-2 py-4">
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
