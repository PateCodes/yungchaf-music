
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  collectionGroup,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to fetch a Firestore collection or query in real-time.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>))  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // A collectionGroup query has a different structure, so we check for _query.
    // A standard collection/doc query has a `path` property.
    // This check determines if the query is valid and ready to be executed.
    const isQueryValid = memoizedTargetRefOrQuery && 
        (memoizedTargetRefOrQuery.path ? !memoizedTargetRefOrQuery.path.includes('undefined') : (memoizedTargetRefOrQuery as any)._query);

    if (!isQueryValid) {
      setData(null);
      setIsLoading(false); // If query is not valid, we are not loading.
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setData(results);
        setIsLoading(false);
        setError(null); // Clear previous errors
      },
      (err: FirestoreError) => {
        // Guard against an invalid query object becoming null during the async error callback.
        if (!memoizedTargetRefOrQuery) {
            const safeError = new Error("A Firestore query failed after its reference became null. This is often due to a race condition where a component re-renders before the listener is fully torn down.");
            setError(safeError);
            setIsLoading(false);
            console.error(safeError);
            return;
        }

        // Determine path for error reporting. CollectionGroup queries store it differently.
        let errorPath = 'unknown/path';
        if ((memoizedTargetRefOrQuery as any)._query?.path?.segments) {
            errorPath = (memoizedTargetRefOrQuery as any)._query.path.segments.join('/');
        } else if (memoizedTargetRefOrQuery.path) {
            errorPath = memoizedTargetRefOrQuery.path;
        }


        // Safeguard to prevent creating an error for a path that is undefined.
        if (typeof errorPath !== 'string' || errorPath.includes('undefined')) {
             const pathError = new Error(`Attempted to query an invalid Firestore path: '${errorPath}'. This usually means a query was created with an undefined variable.`);
             setError(pathError);
             setData(null);
             setIsLoading(false);
             console.error(pathError); // This is what shows in the console
             return; // Stop further execution
        }
        
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: errorPath,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        
        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // This cleanup function will be called when the component unmounts
    // or when the memoizedTargetRefOrQuery changes.
    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]); // Re-run if the target query/reference changes.

  return { data, isLoading, error };
}
