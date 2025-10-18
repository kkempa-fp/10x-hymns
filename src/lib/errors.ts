const NETWORK_ERROR_MESSAGE = "Nie udało się połączyć z serwerem. Sprawdź połączenie z internetem i spróbuj ponownie.";

export const resolveRequestError = (error: unknown, fallback: string) => {
  if (error instanceof TypeError) {
    return NETWORK_ERROR_MESSAGE;
  }

  if (error instanceof Error) {
    if (error.message === "Failed to fetch" || error.message === "NetworkError when attempting to fetch resource.") {
      return NETWORK_ERROR_MESSAGE;
    }

    if (error.message) {
      return error.message;
    }
  }

  return fallback;
};

export const resolveMutationError = resolveRequestError;
