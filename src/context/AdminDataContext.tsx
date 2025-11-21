
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';

// Data Interfaces
interface Fan {
  id: string;
  username?: string;
  email?: string;
  photoURL?: string;
  joinDate?: { seconds: number };
  lastActive?: { seconds: number };
}

interface Contribution {
  id:string;
  fanId: string;
  amount: number;
  currency: 'KES' | 'USD';
  timestamp?: { seconds: number };
  method: string;
  status: 'pending' | 'completed' | 'failed';
}

interface Like {
  id: string;
  fanId: string;
  musicId: string;
  likeDate?: { seconds: number };
}

interface CommentReply {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: any;
}

interface Comment {
  id: string;
  fanId: string;
  musicId: string;
  username: string;
  photoURL?: string;
  content: string;
  commentDate?: {
    seconds: number;
    nanoseconds: number;
  } | null;
  likes?: string[];
  reactions?: Record<string, string[]>;
  replies?: CommentReply[];
}

interface Message {
  id: string;
  name: string;
  message: string;
  submittedAt: { seconds: number };
  lastRepliedAt?: { seconds: number };
  replies?: any[];
  read: boolean;
  fanId?: string;
}

interface AdminDataContextProps {
    fans: Fan[] | null;
    likes: Like[] | null;
    comments: Comment[] | null;
    messages: Message[] | null;
    contributions: Contribution[] | null;
}

const AdminDataContext = createContext<AdminDataContextProps | undefined>(undefined);

// This internal component contains all the expensive queries.
// It will ONLY be rendered if the user is confirmed to be an admin.
const AdminDataFetcher: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const firestore = useFirestore();

    const fansQuery = useMemoFirebase(() => query(collection(firestore, "fans")), [firestore]);
    const likesQuery = useMemoFirebase(() => query(collectionGroup(firestore, "likes")), [firestore]);
    const commentsQuery = useMemoFirebase(() => query(collectionGroup(firestore, "comments")), [firestore]);
    const messagesQuery = useMemoFirebase(() => query(collection(firestore, "messages")), [firestore]);
    const contributionsQuery = useMemoFirebase(() => query(collection(firestore, "contributions")), [firestore]);
    
    const { data: fans } = useCollection<Fan>(fansQuery);
    const { data: likes } = useCollection<Like>(likesQuery);
    const { data: comments } = useCollection<Comment>(commentsQuery);
    const { data: messages } = useCollection<Message>(messagesQuery);
    const { data: contributions } = useCollection<Contribution>(contributionsQuery);
    
    const value = useMemo(() => ({
        fans,
        likes,
        comments,
        messages,
        contributions,
    }), [fans, likes, comments, messages, contributions]);
    
    return (
        <AdminDataContext.Provider value={value}>
            {children}
        </AdminDataContext.Provider>
    );
};


export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAdmin } = useUser();

    // The AdminDataFetcher (and all its expensive queries) will only be mounted
    // if the user is confirmed to be an admin.
    if (isAdmin) {
        return <AdminDataFetcher>{children}</AdminDataFetcher>;
    }
    
    // For non-admins, provide a safe, empty context without running any queries.
    const emptyValue: AdminDataContextProps = {
        fans: null,
        likes: null,
        comments: null,
        messages: null,
        contributions: null,
    };

    return (
        <AdminDataContext.Provider value={emptyValue}>
            {children}
        </AdminDataContext.Provider>
    );
};


export const useAdminData = () => {
    const context = useContext(AdminDataContext);
    if (context === undefined) {
        throw new Error('useAdminData must be used within an AdminDataProvider');
    }
    return context;
};
