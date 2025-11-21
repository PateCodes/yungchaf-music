
'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { socialLinks } from '@/lib/constants';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser } from '@/firebase';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const { user } = useUser();
  const aboutImage = PlaceHolderImages.find((img) => img.id === 'about1');
  
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2">
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
                <div className="flex flex-col justify-center p-8 lg:p-12">
                  <h1 className="font-headline text-4xl font-bold sm:text-5xl text-center mb-6">
                    About Yung Chaf
                  </h1>
                  <blockquote className="mt-4 border-l-4 border-primary pl-4 text-xl font-semibold italic text-center mx-auto">
                    "Every track carries emotion."
                  </blockquote>
                  <div className="mt-8 space-y-4 text-muted-foreground max-w-2xl mx-auto">
                    <p>
                      Yung Chaf is a multi-talented musician known for his genre-blending sound and captivating storytelling. With a passion for music, every creation is a journey into a unique emotional landscape.
                    </p>
                    <p>
                      From the vibrant energy of his live performances to the intricate details of his studio recordings, Yung Chaf's work is a testament to his dedication to the craft. He constantly pushes creative boundaries, inviting listeners to explore new perspectives through his music.
                    </p>
                  </div>
                  {user && (
                      <div className="mt-10 text-center">
                      <h3 className="text-lg font-semibold">Connect with Me</h3>
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                          {socialLinks.map((social) => (
                          <Button key={social.name} asChild variant="outline" size="icon">
                              <a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.name}>
                              <social.icon className="h-5 w-5" />
                              </a>
                          </Button>
                          ))}
                      </div>
                      </div>
                  )}
                </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
