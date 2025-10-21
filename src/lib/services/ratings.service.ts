import type { SupabaseClient } from "../../db/supabase.client.ts";
import type {
  SubmitRatingCommand,
  SubmitRatingResponseDto,
  RatingInsert,
  RatingPersistenceModel,
  RatingValue,
} from "../../types";

/**
 * Custom error class for the RatingService.
 * This allows for associating a specific HTTP status code with errors,
 * which is useful for generating appropriate API responses.
 */
export class RatingServiceError extends Error {
  readonly status: number;
  override readonly cause?: unknown;

  /**
   * Creates an instance of RatingServiceError.
   * @param message - The error message.
   * @param status - The HTTP status code associated with the error. Defaults to 500.
   * @param options - Optional parameters, including the original error cause.
   */
  constructor(message: string, status = 500, options?: { cause?: unknown }) {
    super(message);
    this.name = "RatingServiceError";
    this.status = status;
    this.cause = options?.cause;
  }
}

const RATINGS_TABLE = "ratings" as const;

/**
 * Normalizes and validates an array of proposed hymn numbers.
 * It trims whitespace from each number and filters out any empty entries.
 *
 * @param numbers - An array of hymn numbers as strings.
 * @returns A new array containing the cleaned, non-empty hymn numbers.
 * @throws {RatingServiceError} If the resulting array of numbers is empty.
 */
const normalizeHymnNumbers = (
  numbers: SubmitRatingCommand["proposed_hymn_numbers"]
): RatingPersistenceModel["proposed_hymn_numbers"] => {
  const normalized = numbers.map((value) => value.trim()).filter((value) => value.length > 0);

  if (!normalized.length) {
    throw new RatingServiceError("At least one hymn number must be provided", 400);
  }

  return normalized;
};

/**
 * Type guard to check if a string is a valid rating value ('up' or 'down').
 *
 * @param value - The string value to check.
 * @returns `true` if the value is a valid `RatingValue`, otherwise `false`.
 */
const isValidRatingValue = (value: string): value is RatingValue => value === "up" || value === "down";

/**
 * A factory function that creates an instance of the RatingsService.
 * This service is responsible for handling the submission of ratings for hymn suggestions.
 *
 * @param supabase - An instance of the SupabaseClient used for database operations.
 * @returns An object with a `submit` method.
 */
export const createRatingsService = (supabase: SupabaseClient) => {
  /**
   * Submits a rating for a set of hymn suggestions.
   * The function validates the input, normalizes the data, and inserts it into the database.
   *
   * @param command - The command object containing the rating details.
   * @param userId - The ID of the user submitting the rating, or `null` for anonymous users.
   * @returns A promise that resolves to a `SubmitRatingResponseDto` on success.
   * @throws {RatingServiceError} If the rating value is invalid, no hymn numbers are provided, or the database insertion fails.
   */
  const submit = async (command: SubmitRatingCommand, userId: string | null): Promise<SubmitRatingResponseDto> => {
    if (!isValidRatingValue(command.rating)) {
      throw new RatingServiceError("Invalid rating value", 400);
    }

    const proposedNumbers = normalizeHymnNumbers(command.proposed_hymn_numbers);

    const payload: RatingInsert = {
      client_fingerprint: command.client_fingerprint,
      rating: command.rating,
      proposed_hymn_numbers: proposedNumbers,
      user_id: userId,
    };

    const { error } = await supabase.from(RATINGS_TABLE).insert(payload);

    if (error) {
      throw new RatingServiceError("Unable to submit rating", 500, { cause: error });
    }

    return { message: "Rating submitted successfully." } satisfies SubmitRatingResponseDto;
  };

  return { submit };
};
