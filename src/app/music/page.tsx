
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { platformLinks } from '@/lib/constants';
import { Music } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { MusicTrack } from '@/components/music-track';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface Music {
  id: string;
  title: string;
  youtubeUrl: string;
}

const hardcodedTracks: Music[] = [
    {
        id: 'top-buoy',
        title: 'Top Buoy',
        youtubeUrl: 'https://youtu.be/JFCQsekgCUA'
    },
    {
        id: 'fi-di-night',
        title: 'Fi Di Night',
        youtubeUrl: 'https://youtu.be/ezjb_U-p39Y'
    }
];

export default function MusicPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, isUserLoading, router]);

  const musicQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'music'), orderBy('uploadDate', 'desc'))
        : null,
    [firestore]
  );

  const { data: musicTracks, isLoading } = useCollection<Music>(musicQuery);

  const allTracks = [...hardcodedTracks, ...(musicTracks || [])];

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        className="text-center mb-12"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">
          Music
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Listen to my latest tracks, EPs, and albums directly from Spotify &
          YouTube.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {isLoading &&
            [...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-3/4 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-md"></div>
                </CardContent>
              </Card>
            ))}
          {allTracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={sectionVariants}
              transition={{ delay: index * 0.1 }}
            >
              <MusicTrack track={track} />
            </motion.div>
          ))}

          <motion.div
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true, amount: 0.3 }}
             variants={sectionVariants}
          >
            <Card className="overflow-hidden shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <Music className="h-6 w-6" /> Spotify
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  style={{ borderRadius: '0' }}
                  src="https://open.spotify.com/embed/artist/0cC7K3Uu87ULT9NyC0LKPw?utm_source=generator&theme=0"
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                ></iframe>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div 
          className="space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          {/* Other Platforms */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Find Me On</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
              {platformLinks.map((platform) => (
                <Button
                  key={platform.name}
                  asChild
                  variant="outline"
                  className="justify-start"
                >
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <platform.icon className="mr-2 h-5 w-5" />
                    {platform.name}
                  </a>
                </Button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
