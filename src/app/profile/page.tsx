
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useAuth, useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateEmail } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Music } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const profileFormSchema = z.object({
  firstName: z
    .string()
    .min(2, {
      message: 'First name must be at least 2 characters.',
    })
    .max(30, {
      message: 'First name must not be longer than 30 characters.',
    }),
  lastName: z
    .string()
    .min(2, {
      message: 'Last name must be at least 2 characters.',
    })
    .max(30, {
        message: 'Last name must not be longer than 30 characters.',
    }),
  photoURL: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
});

const passwordFormSchema = z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const emailFormSchema = z.object({
    newEmail: z.string().email({ message: 'Please enter a valid email.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type EmailFormValues = z.infer<typeof emailFormSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  const defaultAvatars = [
    `https://api.dicebear.com/8.x/initials/svg?seed=${user?.displayName || user?.email}`,
    `https://api.dicebear.com/8.x/bottts/svg?seed=${user?.displayName || user?.email}`,
    `https://api.dicebear.com/8.x/avataaars/svg?seed=${user?.displayName || user?.email}`,
    `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user?.displayName || user?.email}`,
  ]

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      photoURL: '',
    },
    mode: 'onChange',
  });
  
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const emailForm = useForm<EmailFormValues>({
      resolver: zodResolver(emailFormSchema),
      defaultValues: {
          newEmail: '',
          password: '',
      },
      mode: 'onChange',
  });

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push('/sign-in');
      } else {
        const [firstName, ...lastNameParts] = (user.displayName || '').split(' ');
        profileForm.reset({
          firstName: firstName || '',
          lastName: lastNameParts.join(' ') || '',
          photoURL: user.photoURL || '',
        });
      }
    }
  }, [user, isUserLoading, router, profileForm]);

  async function onProfileSubmit(data: ProfileFormValues) {
    if (!user || !auth?.currentUser || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be signed in to update your profile.',
      });
      return;
    }

    setIsSubmitting(true);
    const displayName = `${data.firstName} ${data.lastName}`.trim();

    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: data.photoURL,
      });

      const fanRef = doc(firestore, 'fans', user.uid);
      const fanData = {
        firstName: data.firstName,
        lastName: data.lastName,
        username: displayName,
        photoURL: data.photoURL,
      };

      updateDocumentNonBlocking(fanRef, fanData);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating auth profile:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'Could not update your authentication profile.',
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    if (!user || !auth?.currentUser) return;
    
    setIsPasswordSubmitting(true);
    try {
        await updatePassword(auth.currentUser, data.newPassword);
        toast({
            title: "Password Changed",
            description: "Your password has been updated successfully.",
        });
        passwordForm.reset();
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Error changing password",
            description: error.message || "An error occurred. You might need to sign in again to change your password.",
        });
    } finally {
        setIsPasswordSubmitting(false);
    }
  }

  async function onEmailSubmit(data: EmailFormValues) {
    if (!user || !auth.currentUser || !firestore) return;

    setIsEmailSubmitting(true);
    try {
        if (!user.email) {
            throw new Error("Current user email is not available.");
        }
        const credential = EmailAuthProvider.credential(user.email, data.password);
        await reauthenticateWithCredential(auth.currentUser, credential);

        await updateEmail(auth.currentUser, data.newEmail);

        const fanRef = doc(firestore, 'fans', user.uid);
        updateDocumentNonBlocking(fanRef, { email: data.newEmail });

        toast({
            title: "Email Updated",
            description: "Your email has been successfully updated. Please check your inbox for verification.",
        });
        emailForm.reset();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error updating email",
            description: error.message || "Could not update email. Please check your password and try again.",
        });
    } finally {
        setIsEmailSubmitting(false);
    }
  }

  const setAvatarUrl = (url: string) => {
    profileForm.setValue('photoURL', url, { shouldDirty: true });
  }
  
  if (isUserLoading || !user) {
      return (
        <div className="flex justify-center items-center h-[80vh]">
            <Music className="h-8 w-8 animate-spin" />
        </div>
      )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Manage your account settings and profile information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center space-x-4">
             <Avatar className="h-16 w-16">
                <AvatarImage src={profileForm.watch('photoURL') || user.photoURL || defaultAvatars[0]} alt="User avatar" />
                <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
                <h2 className="font-semibold text-xl">{user.displayName || 'Fan'}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
               <div>
                  <Label>Choose Avatar</Label>
                  <div className="mt-2 flex gap-2">
                    {defaultAvatars.map((url, index) => (
                      <Avatar key={index} className="h-12 w-12 cursor-pointer" onClick={() => setAvatarUrl(url)}>
                        <AvatarImage src={url} />
                        <AvatarFallback>AV</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
              </div>
              <FormField
                control={profileForm.control}
                name="photoURL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Or paste an image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/your-photo.jpg" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                        <Input placeholder="Your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={profileForm.control}
                    name="lastName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                        <Input placeholder="Your last name" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || !profileForm.formState.isDirty}>
                {isSubmitting && <Music className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
            </form>
          </Form>

          <Separator />
            
          <div>
            <h3 className="text-lg font-medium mb-4">Change Email</h3>
            <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                    <FormField
                        control={emailForm.control}
                        name="newEmail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="your-new@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={emailForm.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Enter current password" {...field} />
                                </FormControl>
                                <FormDescription>
                                    For your security, we need to verify your identity.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isEmailSubmitting}>
                        {isEmailSubmitting && <Music className="mr-2 h-4 w-4 animate-spin" />}
                        Update Email
                    </Button>
                </form>
            </Form>
          </div>

          <Separator />
            
          <div>
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Password</FormLabel>

                                <FormControl>
                                    <Input type="password" placeholder="New password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Confirm new password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isPasswordSubmitting}>
                        {isPasswordSubmitting && <Music className="mr-2 h-4 w-4 animate-spin" />}
                        Change Password
                    </Button>
                </form>
            </Form>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
