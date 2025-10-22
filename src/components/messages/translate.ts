import { messages } from "../messages";

type MaybeString = string | null | undefined;

const sanitize = (value: MaybeString) => (typeof value === "string" ? value.trim() : "");

const commonErrorTranslations: Record<string, string> = {
  "Supabase client not configured": messages.common.errors.processRequestFailed,
  "Failed to process request": messages.common.errors.processRequestFailed,
  "Invalid JSON payload": messages.common.errors.processRequestFailed,
  "Failed to read response": messages.common.errors.readResponseFailed,
  "Failed to read response body": messages.common.errors.readResponseFailed,
  "Failed to submit rating": messages.common.errors.submitRatingFailed,
  "Failed to fetch suggestions": messages.common.errors.fetchSuggestionsFailed,
};

const authErrorTranslations: Record<string, string> = {
  "Email is required.": messages.auth.validation.emailRequired,
  "Email must be a valid email address.": messages.auth.validation.emailInvalid,
  "Password is required.": messages.auth.validation.passwordRequired,
  "Invalid login payload.": messages.auth.errors.invalidPayload,
  "Invalid email or password.": messages.auth.errors.invalidCredentials,
  "Please confirm your email before signing in.": messages.auth.errors.emailNotConfirmed,
  "Too many login attempts. Try again later.": messages.auth.errors.tooManyLoginAttempts,
  "Failed to sign in.": messages.auth.errors.loginFailed,
  "Password must be at least 8 characters long.": messages.auth.validation.passwordMin,
  "Password must contain at least one uppercase letter.": messages.auth.validation.passwordUppercase,
  "Password must contain at least one digit.": messages.auth.validation.passwordDigit,
  "Confirm password is required.": messages.auth.validation.confirmPasswordRequired,
  "Passwords must match.": messages.auth.validation.passwordsMismatch,
  "Invalid registration payload.": messages.auth.errors.invalidRegisterPayload,
  "A user with this email already exists.": messages.auth.errors.userAlreadyExists,
  "Failed to register user.": messages.auth.errors.registerFailed,
  "Failed to sign out.": messages.auth.errors.logoutFailed,
  "Unable to fetch session.": messages.auth.errors.sessionApiFailed,
  "Unable to fetch user.": messages.auth.errors.userFetchFailed,
};

const setsErrorTranslations: Record<string, string> = {
  "You must be signed in to view sets.": messages.sets.errors.unauthorized,
  "You must be signed in to create sets.": messages.sets.errors.unauthorized,
  "You must be signed in to update sets.": messages.sets.errors.unauthorized,
  "You must be signed in to delete sets.": messages.sets.errors.unauthorized,
  "Failed to fetch sets": messages.sets.errors.listFetchFailed,
  "Failed to fetch set": messages.sets.errors.notFound,
  "Failed to create set": messages.common.errors.saveSetFailed,
  "Failed to update set": messages.common.errors.saveSetFailed,
  "Failed to delete set": messages.common.errors.deleteSetFailed,
  "A set with this name already exists": messages.sets.form.nameDuplicate,
  "Unable to fetch sets": messages.sets.errors.listFetchFailed,
  "Unable to fetch set": messages.sets.errors.notFound,
  "Unable to create set": messages.common.errors.saveSetFailed,
  "Failed to retrieve created set": messages.common.errors.saveSetFailed,
  "Unable to update set": messages.common.errors.saveSetFailed,
  "Unable to delete set": messages.common.errors.deleteSetFailed,
  "Set not found": messages.sets.errors.notFound,
  "You are not allowed to access this set": messages.sets.errors.unauthorized,
  "User context is required": messages.sets.errors.unauthorized,
};

const suggestionErrorTranslations: Record<string, string> = {
  "Text must be non-empty": messages.suggestion.requireInput,
  "Failed to generate suggestions": messages.common.errors.fetchSuggestionsFailed,
  "Failed to generate embeddings": messages.suggestion.errors.upstreamUnavailable,
};

const translate = (value: MaybeString, fallback: string, domainMap: Record<string, string>) => {
  const normalized = sanitize(value);
  if (!normalized) {
    return fallback;
  }

  return domainMap[normalized] ?? commonErrorTranslations[normalized] ?? fallback;
};

export const translateAuthError = (value: MaybeString, fallback: string) =>
  translate(value, fallback, authErrorTranslations);

export const translateSetsError = (value: MaybeString, fallback: string) =>
  translate(value, fallback, setsErrorTranslations);

export const translateSuggestionError = (value: MaybeString, fallback: string) =>
  translate(value, fallback, suggestionErrorTranslations);

export const translateCommonError = (value: MaybeString, fallback: string) => translate(value, fallback, {});
