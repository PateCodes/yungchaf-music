'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gift, Share2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { socialLinks } from '@/lib/constants';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';


const formSchema = z.object({
  referrerName: z.string().min(2, 'Please enter your name.'),
  friendEmail: z.string().email('Please enter a valid email for your friend.'),
});

export default function ReferPage() {
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState('');
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        setShareUrl(window.location.origin);
    }
     if (!isUserLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, isUserLoading, router]);

  const shareText = `Check out Yung Chaf's music and join the community!`;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referrerName: '',
      friendEmail: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Referral Submitted:', values);
    toast({
      title: 'Referral Sent!',
      description: `An invitation has been sent to ${values.friendEmail}. Thanks for sharing!`,
    });
    form.reset();
  }
  
  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <Gift className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 font-headline text-4xl font-bold tracking-tight sm:text-5xl">Refer a Friend</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Love the music? Share it with your friends and family!
        </p>
      </div>
      
      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle>Send an Invite</CardTitle>
          <CardDescription>
            Enter your name and your friend's email address to send them an invitation to check out Yung Chaf's music.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="referrerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} value={user?.displayName || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="friendEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Friend's Email</FormLabel>
                    <FormControl>
                      <Input placeholder="friend@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Send Invitation
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator className="my-12" />

      <div className="text-center">
        <Share2 className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 font-headline text-3xl font-bold">Share the Vibe</h2>
        <p className="mt-2 max-w-2xl mx-auto text-lg text-muted-foreground">
            Or share a direct link with your friends on social media.
        </p>
        <div className="mt-6 flex justify-center gap-2">
            {socialLinks.map((social) => (
                <Button key={social.name} asChild variant="outline" size="icon">
                    <a href={`https://www.addtoany.com/share#url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
                        <social.icon className="h-5 w-5" />
                    </a>
                </Button>
            ))}
        </div>
      </div>
    </div>
  );
}
