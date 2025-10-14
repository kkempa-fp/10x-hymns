import type { Database } from "./db/database.types";

// ------------------------------------------------------------------------------------------------
// Aliases for base database types derived from the Supabase schema
// ------------------------------------------------------------------------------------------------
export type Hymn = Database["public"]["Tables"]["hymns"]["Row"];
export type Set = Database["public"]["Tables"]["sets"]["Row"];
export type SetInsert = Database["public"]["Tables"]["sets"]["Insert"];
export type SetUpdate = Database["public"]["Tables"]["sets"]["Update"];
export type Rating = Database["public"]["Tables"]["ratings"]["Row"];
export type RatingInsert = Database["public"]["Tables"]["ratings"]["Insert"];

// Guard command payload fields so they stay aligned with the persisted set row shape.
type SetContentColumns = keyof Pick<Set, "name" | "entrance" | "offertory" | "communion" | "adoration" | "recessional">;

export type HymnNumber = Hymn["number"];

// ------------------------------------------------------------------------------------------------
// 1. Hymn Suggestion Command & DTOs
//    Drive the POST /api/suggestions endpoint for requesting and returning hymn suggestions.
// ------------------------------------------------------------------------------------------------
export interface GenerateSuggestionsCommand {
  text: string;
  count?: number;
}

export type SuggestionDto = Pick<Hymn, "number" | "name" | "category">;

export interface GenerateSuggestionsResponseDto {
  data: SuggestionDto[];
}

// ------------------------------------------------------------------------------------------------
// 2. Rating Command & DTOs
//    Capture hymn suggestion feedback via POST /api/ratings.
// ------------------------------------------------------------------------------------------------
export type RatingValue = "up" | "down";

export interface SubmitRatingCommand extends Pick<RatingInsert, "client_fingerprint"> {
  proposed_hymn_numbers: HymnNumber[];
  rating: RatingValue;
  // Services should convert hymn numbers to the numeric array expected by RatingPersistenceModel.
}

export interface SubmitRatingResponseDto {
  message: string;
}

// ------------------------------------------------------------------------------------------------
// 3. Set Commands & DTOs
//    Shared models for querying, creating, updating, and deleting sets.
// ------------------------------------------------------------------------------------------------
export interface ListSetsQueryDto {
  search?: string;
  page?: number;
  limit?: number;
  sort?: "name" | "created_at" | "updated_at";
  order?: "asc" | "desc";
}

export type SetDto = Pick<
  Set,
  "id" | "name" | "entrance" | "offertory" | "communion" | "adoration" | "recessional" | "created_at" | "updated_at"
>;

export interface ListSetsResponseDto {
  data: SetDto[];
}

export type CreateSetCommand = Pick<SetInsert, SetContentColumns>;

export interface CreateSetResponseDto {
  data: SetDto;
}

export interface GetSetResponseDto {
  data: SetDto;
}

export type UpdateSetCommand = Pick<SetUpdate, SetContentColumns>;

export interface UpdateSetResponseDto {
  data: SetDto;
}

export type DeleteSetResponseDto = null;

// ------------------------------------------------------------------------------------------------
// 4. Persistence Helper Models
//    Re-exported for consumers that need direct access to persistence-layer types.
// ------------------------------------------------------------------------------------------------
export type RatingPersistenceModel = RatingInsert;
export type SetPersistenceModel = Set;
