import { useCallback, useEffect, useRef, useState } from "react";
import { messages } from "@/components/messages";
import { translateSetsError } from "@/components/messages/translate";
import { resolveRequestError } from "@/lib/errors";
import type { CreateSetCommand, SetDto, UpdateSetCommand } from "@/types";

interface UseSetMutationResult {
  createSet: (payload: CreateSetCommand) => Promise<SetDto | null>;
  deleteSet: (id: string) => Promise<boolean>;
  error: string | null;
  loading: boolean;
  resetError: () => void;
  updateSet: (id: string, payload: UpdateSetCommand) => Promise<SetDto | null>;
}

const useSetMutation = (): UseSetMutationResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resetError = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    setError(null);
  }, []);

  const handleResponse = useCallback(async <T>(response: Response, fallback: string): Promise<T> => {
    if (!response.ok) {
      try {
        const payload = await response.json();
        const rawMessage =
          typeof payload?.error === "string" ? payload.error : messages.common.errors.processRequestFailed;
        const translated = translateSetsError(rawMessage, fallback);
        throw new Error(translated);
      } catch {
        throw new Error(fallback);
      }
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength === "0" || contentLength === null) {
      try {
        const clone = response.clone();
        const text = await clone.text();
        if (!text) {
          return undefined as T;
        }
      } catch {
        return undefined as T;
      }
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new Error(messages.common.errors.readResponseFailed);
    }
  }, []);

  const runMutation = useCallback(
    async <T>(
      request: () => Promise<Response>,
      fallback: string,
      onSuccess?: (result: T) => void
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await request();
        const payload = await handleResponse<T>(response, fallback);
        if (isMountedRef.current) {
          onSuccess?.(payload);
        }
        return payload;
      } catch (unknownError) {
        if (isMountedRef.current) {
          const rawMessage = resolveRequestError(unknownError, fallback, messages.common.errors.network);
          const translated = translateSetsError(rawMessage, fallback);
          setError(translated);
        }
        return null;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [handleResponse]
  );

  const createSet: UseSetMutationResult["createSet"] = useCallback(
    async (payload) => {
      const result = await runMutation<{ data: SetDto }>(
        () =>
          fetch("/api/sets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
        messages.common.errors.saveSetFailed
      );

      return result?.data ?? null;
    },
    [runMutation]
  );

  const updateSet: UseSetMutationResult["updateSet"] = useCallback(
    async (id, payload) => {
      const result = await runMutation<{ data: SetDto }>(
        () =>
          fetch(`/api/sets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
        messages.common.errors.saveSetFailed
      );

      return result?.data ?? null;
    },
    [runMutation]
  );

  const deleteSet: UseSetMutationResult["deleteSet"] = useCallback(
    async (id) => {
      const result = await runMutation<null>(
        () =>
          fetch(`/api/sets/${id}`, {
            method: "DELETE",
          }),
        messages.common.errors.deleteSetFailed
      );

      return result !== null;
    },
    [runMutation]
  );

  return { createSet, deleteSet, error, loading, resetError, updateSet };
};

export default useSetMutation;
