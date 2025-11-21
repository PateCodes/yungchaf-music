
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';

export default function SettingsPage() {
  const { user, isAdmin, isSuperAdmin } = useUser();

  const getRoleName = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isAdmin) return 'Admin';
    return 'Fan';
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Details about your current user session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <span className="font-medium">Email</span>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <span className="font-medium">User ID</span>
            <span className="text-sm text-muted-foreground">{user?.uid}</span>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <span className="font-medium">Role</span>
            <span className="text-sm font-bold uppercase text-primary">{getRoleName()}</span>
          </div>
          <CardDescription>
            Admin roles are managed via the `admins` collection in your Firestore database.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
