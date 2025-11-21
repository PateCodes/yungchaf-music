
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, Unsubscribe, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, IdTokenResult } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { errorEmitter, FirestorePermissionError } from '@/firebase';

interface CustomClaims {
  admin?: boolean;
  superAdmin?: boolean;
  [key: string]: any;
}

interface UserProfile {
  [key: string]: any;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  claims: CustomClaims | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean; 
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; 
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser extends UserAuthState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Return type for useUser()
export type UserHookResult = UserAuthState;

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state including custom claims.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    claims: null,
    profile: null,
    isAdmin: false,
    isSuperAdmin: false,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  useEffect(() => {
    if (!auth || !firestore) {
      setUserAuthState({ user: null, claims: null, profile: null, isAdmin: false, isSuperAdmin: false, isUserLoading: false, userError: new Error("Auth or Firestore service not provided.") });
      return;
    }
    
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // User is logged out
        setUserAuthState({
          user: null,
          claims: null,
          profile: null,
          isAdmin: false,
          isSuperAdmin: false,
          isUserLoading: false,
          userError: null
        });
        return;
      }

      // Check if user is an admin by reading from the /admins collection
      let isAdmin = false;
      let isSuperAdmin = false;
      const adminDocRef = doc(firestore, 'admins', firebaseUser.uid);
      
      try {
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists()) {
          isAdmin = true;
          const adminData = adminDoc.data();
          if (adminData.role === 'super-admin') {
            isSuperAdmin = true;
          }
        }
      } catch (e) {
        // This can happen if rules deny the read. The user is not an admin.
        // This is not an application error, but an expected result for non-admins.
      }


      // --- Update User's Last Active Timestamp (using set with merge for safety) ---
      const fanDocRef = doc(firestore, 'fans', firebaseUser.uid);
      setDoc(fanDocRef, { lastActive: serverTimestamp() }, { merge: true }).catch(error => {
          const permissionError = new FirestorePermissionError({
            path: fanDocRef.path,
            operation: 'update',
            requestResourceData: { lastActive: 'serverTimestamp' }
          });
          errorEmitter.emit('permission-error', permissionError);
      });

      // Update state with user and their determined admin status
      setUserAuthState({
        user: firebaseUser,
        claims: { admin: isAdmin, superAdmin: isSuperAdmin }, // Set claims based on collection check
        profile: null, // Profile data can be loaded separately if needed
        isAdmin: isAdmin,
        isSuperAdmin: isSuperAdmin,
        isUserLoading: false, // Loading is complete
        userError: null,
      });
    });

    return () => authUnsubscribe();
  }, [auth, firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      ...userAuthState
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    claims: context.claims,
    profile: context.profile,
    isAdmin: context.isAdmin,
    isSuperAdmin: context.isSuperAdmin,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>)._memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, custom claims, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, claims, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { 
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  const { user, claims, profile, isAdmin, isSuperAdmin, isUserLoading, userError } = context;
  return { user, claims, profile, isAdmin, isSuperAdmin, isUserLoading, userError };
};

interface FirebaseProviderProps {
    children: ReactNode;
    firebaseApp: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
}
