
'use client';

import { Mail, Phone, User, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { contactInfo, socialLinks } from '@/lib/constants';
import ContactForm from './contact-form';
import { Button } from '@/components/ui/button';
import { FaWhatsapp } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';

export default function ContactPage() {
    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    };
    
    const managerIg = {
        name: 'Instagram',
        url: 'https://www.instagram.com/ric_pate?utm_source=qr&igsh=dTgyMXNjaWFwcGM4',
        icon: Instagram,
    };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        className="text-center mb-12"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">Get in Touch</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Have a question or want to work together? We'd love to hear from you!
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <motion.div 
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
        >
          <motion.div variants={sectionVariants}>
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center gap-4">
                <User className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>Artist Contact</CardTitle>
                    <CardDescription>Directly reach out to {contactInfo.artist.name}</CardDescription>
                </div>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className='space-y-2'>
                    <a href={`mailto:${contactInfo.artist.email}`} className="flex items-center gap-3 text-lg hover:text-primary transition-colors">
                    <Mail className="h-5 w-5" />
                    <span>{contactInfo.artist.email}</span>
                    </a>
                    <a href={`tel:${contactInfo.artist.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-lg hover:text-primary transition-colors">
                    <Phone className="h-5 w-5" />
                    <span>{contactInfo.artist.phone}</span>
                    </a>
                    <a href={`https://wa.me/${contactInfo.artist.phone.replace(/\s/g, '').replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-lg hover:text-primary transition-colors">
                        <FaWhatsapp className="h-5 w-5" />
                        <span>WhatsApp</span>
                    </a>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                    {socialLinks.map((social) => (
                         <motion.div
                            key={social.name}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                        >
                            <Button asChild variant="outline" size="icon">
                            <a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.name}>
                                <social.icon className="h-5 w-5" />
                            </a>
                            </Button>
                        </motion.div>
                    ))}
                    </div>
                </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={sectionVariants}>
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center gap-4">
                <User className="h-8 w-8 text-accent" />
                <div>
                    <CardTitle>Manager Contact</CardTitle>
                    <CardDescription>For bookings and business inquiries</CardDescription>
                </div>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <p className="font-bold">{contactInfo.manager.name}</p>
                    <a href={`mailto:${contactInfo.manager.email}`} className="flex items-center gap-3 text-lg hover:text-primary transition-colors">
                        <Mail className="h-5 w-5" />
                        <span>{contactInfo.manager.email}</span>
                    </a>
                    <a href={`tel:${contactInfo.manager.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-lg hover:text-primary transition-colors">
                        <Phone className="h-5 w-5" />
                        <span>{contactInfo.manager.phone}</span>
                    </a>
                    <a href={`https://wa.me/${contactInfo.manager.phone.replace(/\s/g, '').replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-lg hover:text-primary transition-colors">
                        <FaWhatsapp className="h-5 w-5" />
                        <span>WhatsApp</span>
                    </a>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                    {managerIg && (
                       <motion.div
                            key={managerIg.name}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                        >
                            <Button asChild variant="outline" size="icon">
                            <a href={managerIg.url} target="_blank" rel="noopener noreferrer" aria-label={managerIg.name}>
                                <managerIg.icon className="h-5 w-5" />
                            </a>
                            </Button>
                        </motion.div>
                    )}
                    </div>
                </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={{ visible: { ...sectionVariants.visible, transition: { ...sectionVariants.visible.transition, delay: 0.2 } } }}>
            <Card className="shadow-2xl">
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><MessageSquare className="h-6 w-6" /> Send a Message</CardTitle>
                <CardDescription>Use the form below to send a general message.</CardDescription>
            </CardHeader>
            <CardContent>
                <ContactForm />
            </CardContent>
            </Card>
        </motion.div>
      </div>
    </div>
  );
}
