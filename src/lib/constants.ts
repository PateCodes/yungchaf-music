
import { Facebook, Instagram, Youtube, Music, Paintbrush, User, Mail, Sparkles, LogIn, UserPlus, Shield, Handshake, Gift, HeartHandshake, Bell, Calendar } from 'lucide-react';
import { TikTokIcon } from '@/components/icons';
import { SiSpotify } from '@icons-pack/react-simple-icons';

export const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/music', label: 'Music' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/support', label: 'Support', icon: HeartHandshake },
  { href: '/refer', label: 'Refer a Friend', icon: Gift },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export const socialLinks = [
  { name: 'TikTok', url: 'https://tiktok.com/@yung.chaf', icon: TikTokIcon },
  { name: 'Facebook', url: 'https://facebook.com/profile.php?id=61556215623950', icon: Facebook },
  { name: 'Instagram', url: 'https://instagram.com/yungchaf', icon: Instagram },
  { name: 'YouTube', url: 'https://www.youtube.com/@yungchaf', icon: Youtube },
];

export const platformLinks = [
  ...socialLinks,
  { name: 'Spotify', url: 'https://open.spotify.com/artist/0cC7K3Uu87ULT9NyC0LKPw?si=8276cf71d3b642cb', icon: SiSpotify },
]

export const contactInfo = {
  artist: {
    name: 'Yung Chaf',
    email: 'yungchaf@gmail.com',
    phone: '+254 758 831048',
  },
  manager: {
    name: 'Ricpate',
    email: 'pate4356@gmail.com',
    phone: '+254 791 066116'
  }
};
