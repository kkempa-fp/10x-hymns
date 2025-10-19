import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

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

  const loadSession = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/session", { credentials: "include" });

      if (!response.ok) {
        throw new Error("Nie udało się pobrać informacji o sesji.");
      }

      const data = (await response.json()) as { user: User | null };

      if (!isMountedRef.current) {
        return;
      }

      setUser(data.user ?? null);
      setError(null);
    } catch (sessionError) {
      if (!isMountedRef.current) {
        return;
      }

      setUser(null);
      setError(sessionError instanceof Error ? sessionError.message : "Nie udało się pobrać informacji o sesji.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadSession();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadSession]);

  const resetError = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    setError(null);
  }, []);

  const signIn = useCallback(
    async ({ email, password }: AuthFormValues) => {
      setLoading(true);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Nie udało się zalogować.");
        }

        await loadSession();

        if (isMountedRef.current) {
          setError(null);
        }

        return true;
      } catch (authError) {
        if (isMountedRef.current) {
          setError(authError instanceof Error ? authError.message : "Nie udało się zalogować.");
          setLoading(false);
        }

        return false;
      }
    },
    [loadSession]
  );

  const signUp = useCallback(
    async ({ email, password }: AuthFormValues) => {
      setLoading(true);

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, confirmPassword: password }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Nie udało się zarejestrować użytkownika.");
        }

        await loadSession();

        if (isMountedRef.current) {
          setError(null);
        }

        return true;
      } catch (authError) {
        if (isMountedRef.current) {
          setError(authError instanceof Error ? authError.message : "Nie udało się zarejestrować użytkownika.");
          setLoading(false);
        }

        return false;
      }
    },
    [loadSession]
  );

  const signOut = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Nie udało się wylogować.");
      }

      if (isMountedRef.current) {
        setUser(null);
        setError(null);
        setLoading(false);
      }

      return true;
    } catch (signOutError) {
      if (isMountedRef.current) {
        setError(signOutError instanceof Error ? signOutError.message : "Nie udało się wylogować.");
        setLoading(false);
      }

      return false;
    }
  }, []);

  return { error, loading, resetError, signIn, signOut, signUp, user };
};

export default useAuth;
