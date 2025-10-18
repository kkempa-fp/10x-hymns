import { useCallback, useEffect, useRef, useState } from "react";
import type { AsyncState, ListSetsQueryDto, ListSetsResponseDto } from "@/types";
import { resolveRequestError } from "@/lib/errors";

interface UseSetsResult {
  data: ListSetsResponseDto | null;
  error: string | null;
  loading: boolean;
  query: ListSetsQueryDto;
  refetch: () => Promise<void>;
  setQuery: (next: ListSetsQueryDto | ((previous: ListSetsQueryDto) => ListSetsQueryDto)) => void;
}

const DEFAULT_STATE: AsyncState<ListSetsResponseDto> = {
  data: null,
  error: null,
  loading: false,
};

const useSets = (initialQuery: ListSetsQueryDto = {}): UseSetsResult => {
  const [query, setQueryState] = useState<ListSetsQueryDto>(initialQuery);
  const [state, setState] = useState<AsyncState<ListSetsResponseDto>>(DEFAULT_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSets = useCallback(async (currentQuery: ListSetsQueryDto) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState((previous) => ({ ...previous, loading: true, error: null }));

    try {
      const params = new URLSearchParams();
      Object.entries(currentQuery).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          return;
        }

        params.append(key, String(value));
      });

      const url = params.toString() ? `/api/sets?${params.toString()}` : "/api/sets";
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Nie udało się pobrać listy zestawów.");
      }

      const payload = (await response.json()) as ListSetsResponseDto;
      setState({ data: payload, error: null, loading: false });
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        return;
      }

      const message = resolveRequestError(requestError, "Nie udało się pobrać listy zestawów.");
      setState((previous) => ({ data: previous.data, error: message, loading: false }));
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchSets(query);
  }, [fetchSets, query]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    void fetchSets(query);

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchSets, query]);

  const setQuery = useCallback((next: ListSetsQueryDto | ((previous: ListSetsQueryDto) => ListSetsQueryDto)) => {
    setQueryState((previous) => {
      if (typeof next === "function") {
        return next(previous);
      }

      return next;
    });
  }, []);

  return {
    data: state.data,
    error: state.error,
    loading: state.loading,
    query,
    refetch,
    setQuery,
  };
};

export default useSets;
