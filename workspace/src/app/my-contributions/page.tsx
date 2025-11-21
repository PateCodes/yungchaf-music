
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, Query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Data Interfaces
interface Contribution {
  id: string;
  amount: number;
  currency: 'KES' | 'USD';
  method: string;
  timestamp?: { seconds: number };
  status: 'pending' | 'completed' | 'failed';
}

// Format Currency Utility
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Main Page Component
export default function MyContributionsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // The query is now memoized and depends on user.uid
  const contributionsQuery = useMemoFirebase(
    () => {
      if (firestore && user?.uid) {
        return query(
          collection(firestore, 'contributions'),
          where('fanId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
      }
      return null;
    },
    [firestore, user?.uid] // Dependency array ensures query updates when user logs in
  );
  
  const { data: contributions, isLoading: isContributionsLoading } = useCollection<Contribution>(contributionsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, isUserLoading, router]);

  const isLoading = isUserLoading || (user && isContributionsLoading);

  const exportToCSV = () => {
    if (!contributions) return;
    const headers = ['Date', 'Amount', 'Currency', 'Method', 'Status'];
    const rows = contributions.map(c => {
        const date = c.timestamp ? format(new Date(c.timestamp.seconds * 1000), 'yyyy-MM-dd') : 'N/A';
        return [
            date,
            c.amount,
            c.currency,
            c.method,
            c.status || 'N/A'
        ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_contributions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  const exportToPDF = () => {
    if (!contributions) return;
    const doc = new jsPDF();
    const tableColumn = ["Date", "Amount", "Currency", "Method", "Status"];
    const tableRows: any[][] = [];

    contributions.forEach(c => {
        const date = c.timestamp ? format(new Date(c.timestamp.seconds * 1000), 'yyyy-MM-dd') : 'N/A';
        const contributionData = [
            date,
            formatCurrency(c.amount, c.currency),
            c.currency,
            c.method,
            c.status || 'N/A'
        ];
        tableRows.push(contributionData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });
    doc.text("My Contributions Report", 14, 15);
    doc.save("my_contributions.pdf");
  };
  
  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading your contributions...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="shadow-2xl">
        <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <CardTitle>My Contributions</CardTitle>
                    <CardDescription>
                        A history of all your contributions to support the music.
                    </CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                     <Button variant="outline" onClick={exportToCSV} disabled={!contributions || contributions.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        CSV
                    </Button>
                    <Button variant="outline" onClick={exportToPDF} disabled={!contributions || contributions.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : contributions && contributions.length > 0 ? (
                  contributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                        <TableCell className="text-muted-foreground">
                            {contribution.timestamp ? format(new Date(contribution.timestamp.seconds * 1000), 'PPP') : 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-primary">
                            {formatCurrency(contribution.amount, contribution.currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {contribution.method}
                        </TableCell>
                         <TableCell className="text-muted-foreground capitalize">
                            {contribution.status || 'N/A'}
                        </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      You haven't made any contributions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
