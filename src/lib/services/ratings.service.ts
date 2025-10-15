import type { SupabaseClient } from "../../db/supabase.client.ts";
import type {
  SubmitRatingCommand,
  SubmitRatingResponseDto,
  RatingInsert,
  RatingPersistenceModel,
  RatingValue,
} from "../../types";

export class RatingServiceError extends Error {
  readonly status: number;
  override readonly cause?: unknown;

  constructor(message: string, status = 500, options?: { cause?: unknown }) {
    super(message);
    this.name = "RatingServiceError";
    this.status = status;
    this.cause = options?.cause;
  }
}

const RATINGS_TABLE = "ratings" as const;

const toNumericHymnNumbers = (
  numbers: SubmitRatingCommand["proposed_hymn_numbers"]
): RatingPersistenceModel["proposed_hymn_numbers"] => {
  if (!numbers.length) {
    throw new RatingServiceError("At least one hymn number must be provided", 400);
  }

  const parsed = numbers.map((value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
      throw new RatingServiceError("Hymn numbers must be integers", 400);
    }
    return numeric;
  });

  return parsed;
};

const isValidRatingValue = (value: string): value is RatingValue => value === "up" || value === "down";

export const createRatingsService = (supabase: SupabaseClient) => {
  const submit = async (command: SubmitRatingCommand, userId: string | null): Promise<SubmitRatingResponseDto> => {
    if (!isValidRatingValue(command.rating)) {
      throw new RatingServiceError("Invalid rating value", 400);
    }

    const proposedNumbers = toNumericHymnNumbers(command.proposed_hymn_numbers);

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
