
'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import MessagesListPage from './list-page';

export default function MessagesLayout({
  conversation,
  children
}: {
  conversation: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // A conversation is active if the path has more segments than just /admin/messages
  const isConversationActive = pathname.split('/').length > 3;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-[calc(100vh-60px)]">
      <div
        className={cn(
          'col-span-1 lg:col-span-1 flex-col border-r',
          isConversationActive ? 'hidden md:flex' : 'flex'
        )}
      >
        <MessagesListPage />
      </div>
      <div
        className={cn(
          'md:col-span-2 lg:col-span-3 flex-col',
          isConversationActive ? 'flex' : 'hidden md:flex'
        )}
      >
        {isConversationActive ? conversation : children}
      </div>
    </div>
  );
}
