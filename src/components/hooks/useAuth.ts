import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabaseClient } from "@/db/supabase.client";
import type { AuthFormValues } from "@/types";

interface UseAuthResult {
  error: string | null;
  loading: boolean;
  resetError: () => void;
  signIn: (values: AuthFormValues) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  signUp: (values: AuthFormValues) => Promise<boolean>;
  user: User | null;
}

const useAuth = (): UseAuthResult => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const loadUser = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabaseClient.auth.getUser();

      if (!isMountedRef.current) {
        return;
      }

      if (fetchError) {
        setError(fetchError.message);
        setUser(null);
      } else {
        setError(null);
        setUser(data.user ?? null);
      }

      setLoading(false);
    };

    loadUser();

    const { data: authSubscription } = supabaseClient.auth.onAuthStateChange((_, session) => {
      if (!isMountedRef.current) {
        return;
      }

      setUser(session?.user ?? null);
    });

    return () => {
      isMountedRef.current = false;
      authSubscription?.subscription.unsubscribe();
    };
  }, []);

  const resetError = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    setError(null);
  }, []);

  const signIn = useCallback(async ({ email, password }: AuthFormValues) => {
    setLoading(true);
    const { error: authError } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (!isMountedRef.current) {
      return false;
    }

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return false;
    } else {
      setError(null);
    }

    setLoading(false);
    return true;
  }, []);

  const signUp = useCallback(async ({ email, password }: AuthFormValues) => {
    setLoading(true);
    const { error: authError } = await supabaseClient.auth.signUp({ email, password });

    if (!isMountedRef.current) {
      return false;
    }

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return false;
    } else {
      setError(null);
    }

    setLoading(false);
    return true;
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error: signOutError } = await supabaseClient.auth.signOut();

    if (!isMountedRef.current) {
      return false;
    }

    if (signOutError) {
      setError(signOutError.message);
      setLoading(false);
      return false;
    } else {
      setError(null);
      setUser(null);
    }

    setLoading(false);
    return true;
  }, []);

  return { error, loading, resetError, signIn, signOut, signUp, user };
};

export default useAuth;
