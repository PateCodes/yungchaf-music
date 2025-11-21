
'use client';

import { MessageSquareText } from 'lucide-react';

export default function MessagesDefaultPage() {
  return (
    <div className="h-full flex items-center justify-center bg-muted/20">
      <div className="text-center text-muted-foreground">
        <MessageSquareText className="mx-auto h-12 w-12" />
        <p className="mt-2">Select a message to start chatting.</p>
      </div>
    </div>
  );
}
