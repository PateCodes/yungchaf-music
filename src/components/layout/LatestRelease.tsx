
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Youtube } from 'lucide-react';
import { SiSpotify } from '@icons-pack/react-simple-icons';
import { platformLinks } from '@/lib/constants';

export default function LatestRelease() {
    const spotifyUrl = platformLinks.find(p => p.name === 'Spotify')?.url;
    
    return (
        <section className="bg-background py-12 md:py-20 -mt-1">
            <div className="container mx-auto">
                <Card className="overflow-hidden shadow-2xl border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-background to-background">
                    <div className="grid items-center">
                        <div className="p-8 md:p-12 text-center">
                            <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                Latest Release
                            </h2>
                            <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">Out Now</p>
                            <h3 className="mt-4 text-4xl md:text-5xl font-extrabold font-headline">"Code"</h3>
                            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                                Dive into the new single. A blend of raw energy and lyrical depth. Stream it on all major platforms.
                            </p>
                            <div className="mt-8 flex justify-center gap-4">
                                <Button asChild size="lg">
                                    <a href="https://youtu.be/Kj5WIQf7KjA?si=UYtI8VGGbd6q1_1A" target="_blank" rel="noopener noreferrer">
                                        <Youtube className="mr-2 h-5 w-5" />
                                        YouTube
                                    </a>
                                </Button>
                                {spotifyUrl && (
                                    <Button asChild size="lg" variant="secondary">
                                        <a href={spotifyUrl} target="_blank" rel="noopener noreferrer">
                                            <SiSpotify className="mr-2 h-5 w-5" />
                                            Spotify
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </section>
    )
}
