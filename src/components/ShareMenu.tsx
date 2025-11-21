'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Share2, Mail, Twitter, Link as LinkIcon, Instagram } from 'lucide-react';
import { TikTokIcon } from './icons';
import { useToast } from '@/hooks/use-toast';
import { FaSnapchat, FaWhatsapp } from 'react-icons/fa';

interface ShareMenuProps {
  url: string;
  text: string;
}

export function ShareMenu({ url, text }: ShareMenuProps) {
  const { toast } = useToast();
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied!',
      description: 'You can now share it anywhere.',
    });
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: <LinkIcon className="h-4 w-4" />,
      action: copyToClipboard,
    },
    {
      name: 'Email',
      icon: <Mail className="h-4 w-4" />,
      href: `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`,
    },
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp className="h-4 w-4" />,
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    },
    {
      name: 'X (Twitter)',
      icon: <Twitter className="h-4 w-4" />,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: 'Instagram',
      icon: <Instagram className="h-4 w-4" />,
      href: `https://www.instagram.com`, // Direct sharing not possible, links to site
    },
    {
      name: 'TikTok',
      icon: <TikTokIcon className="h-4 w-4" />,
      href: `https://www.tiktok.com`, // Direct sharing not possible, links to site
    },
     {
      name: 'Snapchat',
      icon: <FaSnapchat className="h-4 w-4" />,
      href: `https://www.snapchat.com`, // Direct sharing not possible, links to site
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-2">
          <Share2 className="h-5 w-5" />
          <span className="text-sm font-medium">Share</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {shareOptions.map((option) => (
          <DropdownMenuItem key={option.name} asChild={!!option.href} onClick={option.action}>
            {option.href ? (
              <a href={option.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                {option.icon}
                <span>{option.name}</span>
              </a>
            ) : (
              <div className="flex items-center gap-2 cursor-pointer">
                {option.icon}
                <span>{option.name}</span>
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
