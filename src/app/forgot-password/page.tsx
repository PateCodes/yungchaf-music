
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Music } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Firebase authentication service is not available. Please try again later.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/sign-in`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your inbox (and spam folder) for instructions to reset your password.',
      });
      router.push('/sign-in');
    } catch (err: unknown) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/invalid-email':
            errorMessage = "The email address you entered is not valid.";
            break;
          case 'auth/user-not-found':
            errorMessage = "No account found with this email address.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Too many requests have been sent. Please try again later.";
            break;
          default:
            errorMessage = `An error occurred: ${err.message}`;
            break;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: errorMessage,
      });
      setIsSubmitting(false); // Only set back to false on error
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Forgot Password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Music className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
          </form>
           <div className="mt-6 text-center text-sm">
            Remember your password?{' '}
            <Link href="/sign-in" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
