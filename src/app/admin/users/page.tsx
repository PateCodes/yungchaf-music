
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2, Shield, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

// This is a placeholder for the server-side function that would set custom claims.
// In a real app, this would make a secure API call.
async function setCustomUserClaims(uid: string, claims: { admin?: boolean, superAdmin?: boolean } | null) {
    // In a real application, this would be an API call to a secure backend function
    // that uses the Firebase Admin SDK to set custom claims.
    // For this app, we will log to the console and show a success toast.
    // You would need to set these claims manually in your Firebase backend or via a script.
    console.log(`ACTION REQUIRED: Manually set custom claims for user ${uid}:`, claims);
}


interface AdminUser {
  id: string;
  email?: string;
  username?: string;
  photoURL?: string;
  role: 'admin' | 'super-admin';
}

interface FanUser {
  id: string;
  email?: string;
  username?: string;
  photoURL?: string;
}

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { user, isSuperAdmin, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && !isSuperAdmin) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to manage admins.'
      });
      router.push('/admin');
    }
  }, [isSuperAdmin, isUserLoading, router, toast]);

  const adminsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'admins')) : null),
    [firestore]
  );
  const { data: admins, isLoading } = useCollection<AdminUser>(adminsQuery);
  
  const allFansQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'fans')) : null),
    [firestore]
  );
  const { data: allFans, isLoading: fansLoading } = useCollection<FanUser>(allFansQuery);
  
  const fansMap = useMemo(() => {
    if (!allFans) return new Map<string, FanUser>();
    return new Map(allFans.map(fan => [fan.id, fan]));
  }, [allFans]);

  const enrichedAdmins = useMemo(() => {
    if (!admins) return [];
    return admins.map(admin => {
      const fanData = fansMap.get(admin.id);
      return {
        ...admin,
        username: admin.username || fanData?.username,
        email: admin.email || fanData?.email,
        photoURL: admin.photoURL || fanData?.photoURL,
      }
    });
  }, [admins, fansMap]);


  const nonAdminFans = useMemo(() => {
    if (!allFans || !admins) return [];
    const adminIds = new Set(admins.map(a => a.id));
    return allFans.filter(fan => !adminIds.has(fan.id));
  }, [allFans, admins]);

  const handleRoleChange = async (targetUserId: string, newRole: 'admin' | 'super-admin' | 'fan') => {
    if (!firestore || !isSuperAdmin) return;
    setIsUpdating(targetUserId);

    try {
        if (newRole === 'fan') {
            // 1. Simulate setting custom claims to null
            await setCustomUserClaims(targetUserId, null);
            // 2. Remove the user from the /admins collection
            const adminRef = doc(firestore, 'admins', targetUserId);
            deleteDocumentNonBlocking(adminRef);
            toast({ title: 'Admin Removed', description: 'User role has been set to Fan. They may need to sign out and back in for changes to take effect.' });
        } else {
            // 1. Simulate setting admin or super-admin claims
            const claims = { admin: true, superAdmin: newRole === 'super-admin' };
            await setCustomUserClaims(targetUserId, claims);
            
            // 2. Add or update the user in the /admins collection for record-keeping
            const adminRef = doc(firestore, 'admins', targetUserId);
            const fanData = fansMap.get(targetUserId);
            setDocumentNonBlocking(adminRef, { 
                role: newRole,
                email: fanData?.email || '',
                username: fanData?.username || '',
                id: targetUserId,
            }, { merge: true });

            toast({ title: 'Role Updated', description: `User role has been set to ${newRole}. They may need to sign out and back in for changes to take effect.` });
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsUpdating(null);
    }
  };


  if (isLoading || fansLoading || isUserLoading) {
    return <div>Loading users...</div>;
  }
  
  if (!isSuperAdmin) {
    return null; // Render nothing while redirecting
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Administrators</CardTitle>
          <CardDescription>Grant, revoke, and manage admin roles. Users may need to re-login to see changes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrichedAdmins && enrichedAdmins.length > 0 ? (
                enrichedAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={admin.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${admin.username || admin.id}`} />
                          <AvatarFallback>{admin.username ? admin.username.charAt(0).toUpperCase() : 'A'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{admin.username || 'Unnamed Admin'}</div>
                          <div className="text-xs text-muted-foreground">{admin.email || admin.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${admin.role === 'super-admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {admin.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={admin.id === user?.uid || isUpdating === admin.id}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleRoleChange(admin.id, 'admin')} disabled={admin.role === 'admin'}>Set as Admin</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(admin.id, 'super-admin')} disabled={admin.role === 'super-admin'}>Set as Super Admin</DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem className="text-destructive" onClick={() => handleRoleChange(admin.id, 'fan')}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Revoke Admin
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">No administrators found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Add New Admin</CardTitle>
            <CardDescription>Promote a fan to an administrator.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fan</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {nonAdminFans && nonAdminFans.length > 0 ? (
                        nonAdminFans.map((fan) => (
                             <TableRow key={fan.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                        <AvatarImage src={fan.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${fan.username || fan.id}`} />
                                        <AvatarFallback>{fan.username ? fan.username.charAt(0).toUpperCase() : 'F'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                        <div className="font-medium">{fan.username || 'Unnamed Fan'}</div>
                                         <div className="text-xs text-muted-foreground">{fan.email || fan.id}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" onClick={() => handleRoleChange(fan.id, 'admin')} disabled={isUpdating === fan.id}>
                                      <Shield className="mr-2 h-4 w-4" />
                                      Make Admin
                                  </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">All fans are already admins or no fans exist.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
