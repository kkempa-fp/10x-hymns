const NETWORK_ERROR_SIGNATURES = new Set(["Failed to fetch", "NetworkError when attempting to fetch resource."]);

export const resolveRequestError = (error: unknown, fallback: string, networkMessage?: string) => {
  const networkFallback = networkMessage ?? fallback;

  if (error instanceof TypeError) {
    return networkFallback;
  }

  if (error instanceof Error) {
    if (NETWORK_ERROR_SIGNATURES.has(error.message)) {
      return networkFallback;
    }

    if (typeof error.message === "string" && error.message.trim().length > 0) {
      return error.message.trim();
    }
  }

  return fallback;
};

export const resolveMutationError = resolveRequestError;
