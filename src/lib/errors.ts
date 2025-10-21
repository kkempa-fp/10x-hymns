import { messages } from "./messages";

const NETWORK_ERROR_MESSAGE = messages.common.errors.network;
const DEFAULT_FALLBACK_MESSAGE = messages.common.errors.unknown;

export const resolveRequestError = (error: unknown, fallback: string = DEFAULT_FALLBACK_MESSAGE) => {
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
