import { z } from "zod";
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
type SetContentColumns = keyof Pick<Set, "name" | "content">;

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
  sort?: "name" | "created_at" | "updated_at" | "content";
  order?: "asc" | "desc";
}

export type SetDto = Pick<Set, "id" | "name" | "content" | "created_at" | "updated_at">;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ListSetsResponseDto {
  data: SetDto[];
  meta: PaginationMeta;
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

// ------------------------------------------------------------------------------------------------
// 5. ViewModel Types
//    Client-side models that shape form values and async state containers.
// ------------------------------------------------------------------------------------------------
export interface AuthFormValues {
  email: string;
  password: string;
}

export const LoginFormSchema = z
  .object({
    email: z.string().min(1, "Podaj adres e-mail.").email("Podaj poprawny adres e-mail."),
    password: z.string().min(1, "Podaj hasło."),
  })
  .strict();

export type LoginFormValues = z.infer<typeof LoginFormSchema>;

export const RegisterFormSchema = LoginFormSchema.extend({
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków.")
    .regex(/[A-Z]/, "Hasło powinno zawierać przynajmniej jedną wielką literę.")
    .regex(/[0-9]/, "Hasło powinno zawierać przynajmniej jedną cyfrę."),
  confirmPassword: z.string().min(1, "Potwierdź hasło."),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Hasła muszą być identyczne.",
      path: ["confirmPassword"],
    });
  }
});

export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

export interface SetFormValues {
  content: string;
  name: string;
}

export interface AsyncState<TData> {
  data: TData | null;
  error: string | null;
  loading: boolean;
}

// ------------------------------------------------------------------------------------------------
// 6. Embedding Service Schemas
// ------------------------------------------------------------------------------------------------
const TASK_TYPES = [
  "RETRIEVAL_QUERY",
  "RETRIEVAL_DOCUMENT",
  "SEMANTIC_SIMILARITY",
  "CLASSIFICATION",
  "CLUSTERING",
] as const;

export const TaskTypeSchema = z.enum(TASK_TYPES);

export type TaskType = (typeof TASK_TYPES)[number];

export const EmbeddingParamsSchema = z
  .object({
    content: z.union([
      z.string().min(1, "content must not be empty"),
      z
        .array(z.string().min(1, "content entries must not be empty"))
        .min(1, "content array must include at least one item"),
    ]),
    taskType: TaskTypeSchema.optional(),
    title: z.string().min(1, "title must not be empty").optional(),
    outputDimensionality: z
      .number()
      .int("outputDimensionality must be an integer")
      .positive("outputDimensionality must be positive")
      .max(768, "outputDimensionality exceeds model capabilities")
      .optional(),
  })
  .strict();

export type EmbeddingParams = z.infer<typeof EmbeddingParamsSchema>;
