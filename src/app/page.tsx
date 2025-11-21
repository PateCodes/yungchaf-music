
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { socialLinks } from '@/lib/constants';
import { ArrowRight } from 'lucide-react';
import LatestRelease from '@/components/layout/LatestRelease';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');
  const aboutImage = PlaceHolderImages.find((img) => img.id === 'about1');
  const { user, isAdmin, isUserLoading } = useUser();
  const router = useRouter();

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        staggerChildren: 0.2, // Stagger children animation
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col">
       {/* Hero Section */}
       <section className="relative h-[60vh] min-h-[400px] w-full">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </section>

      <motion.section 
        className="bg-background text-center py-12 px-4 relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        variants={sectionVariants}
      >
          <motion.h1 variants={itemVariants} className="font-headline text-6xl md:text-8xl font-bold text-primary">
            Yung Chaf
          </motion.h1>
          <motion.p variants={itemVariants} className="mt-2 text-xl md:text-2xl font-light tracking-wider text-muted-foreground">Music</motion.p>
          <motion.p variants={itemVariants} className="mt-4 max-w-xl mx-auto text-lg">
            Explore and enjoy my creative world through music. Every track carries emotion.
          </motion.p>
          <motion.div variants={itemVariants}>
            <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/music">Explore My Music</Link>
            </Button>
          </motion.div>
      </motion.section>

      {/* Latest Release Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <LatestRelease />
      </motion.div>


      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Music Section */}
        <motion.section 
            id="music" 
            className="my-16 scroll-mt-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
        >
          <motion.h2 variants={itemVariants} className="mb-8 text-center font-headline text-4xl font-bold">Music</motion.h2>
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className="overflow-hidden shadow-lg">
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
           <motion.div variants={itemVariants} className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/music">See All Music <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </motion.div>
        </motion.section>

        {/* About Section */}
        <motion.section 
            id="about" 
            className="my-16 scroll-mt-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
        >
          <motion.h2 variants={itemVariants} className="mb-8 text-center font-headline text-4xl font-bold">About Yung Chaf</motion.h2>
           <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className="overflow-hidden shadow-lg">
              <div className="grid items-center md:grid-cols-2">
                <div className="relative h-64 w-full md:h-full min-h-[300px]">
                   {aboutImage && (
                    <Image
                      src={aboutImage.imageUrl}
                      alt={aboutImage.description}
                      fill
                      className="object-cover"
                      data-ai-hint={aboutImage.imageHint}
                    />
                   )}
                </div>
                <div className="p-8">
                  <motion.blockquote variants={itemVariants} className="border-l-4 border-primary pl-4 text-xl font-semibold italic">
                   "Every track carries emotion."
                  </motion.blockquote>
                  <motion.p variants={itemVariants} className="mt-4 text-muted-foreground">
                    Yung Chaf is a dynamic musician, weaving compelling narratives through his sound. Dive into his world and experience creativity without bounds.
                  </motion.p>
                  <motion.div variants={itemVariants}>
                    <Button asChild variant="link" className="p-0 mt-6 text-base">
                      <Link href="/about">Learn More <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.section>

        {/* Connect Section */}
        <motion.section 
            id="connect" 
            className="my-16 scroll-mt-20 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={sectionVariants}
        >
          <motion.h2 variants={itemVariants} className="mb-4 text-center font-headline text-4xl font-bold">Connect With Me</motion.h2>
          <motion.p variants={itemVariants} className="mb-8 max-w-xl mx-auto text-lg text-muted-foreground">
            Follow my journey and get the latest updates on social media.
          </motion.p>
          <div className="flex justify-center gap-2">
            {socialLinks.map((social, index) => (
              <motion.div
                key={social.name}
                variants={itemVariants}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                    scale: { type: "spring", stiffness: 400 },
                    rotate: { type: "spring", stiffness: 400 },
                }}
              >
                <Button asChild variant="outline" size="icon" className="h-12 w-12 rounded-full">
                  <a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.name}>
                    <social.icon className="h-6 w-6" />
                  </a>
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
