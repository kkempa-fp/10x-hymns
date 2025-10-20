import type { SupabaseClient } from "../../db/supabase.client.ts";
import type {
  GenerateSuggestionsCommand,
  GenerateSuggestionsResponseDto,
  SuggestionDto,
  SuggestionsMode,
} from "../../types";
import { EMBEDDING_DIMENSION } from "./embedding.constants";
import { embeddingService, EmbeddingServiceError } from "./embedding.service";
import { createMockEmbeddingVector } from "./mock-embedding";
const DEFAULT_SUGGESTION_COUNT = 3;
const MATCH_FUNCTION_NAME = "match_hymns" as const;
const MATCH_COUNT_PARAM = "match_count";
const QUERY_EMBEDDING_PARAM = "query_embedding";

type MatchHymnsRow = Pick<SuggestionDto, "number" | "name" | "category">;

export class SuggestionServiceError extends Error {
  readonly status: number;
  override readonly cause?: unknown;

  constructor(message: string, status = 500, options?: { cause?: unknown }) {
    super(message);
    this.name = "SuggestionServiceError";
    this.status = status;
    this.cause = options?.cause;
  }
}

const mapToSuggestionDto = (row: MatchHymnsRow): SuggestionDto => ({
  number: row.number,
  name: row.name,
  category: row.category,
});

export const createSuggestionsService = (supabase: SupabaseClient) => {
  const generate = async (
    command: GenerateSuggestionsCommand,
    options?: { userId?: string | null }
  ): Promise<GenerateSuggestionsResponseDto> => {
    const useAuthenticatedEmbedding = Boolean(options?.userId);
    let embedding: number[];

    if (useAuthenticatedEmbedding) {
      try {
        const [vector] = await embeddingService.generateEmbeddings({
          content: command.text,
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality: EMBEDDING_DIMENSION,
        });

        embedding = vector;
      } catch (error) {
        if (error instanceof EmbeddingServiceError) {
          throw new SuggestionServiceError(error.message, error.status, { cause: error.cause });
        }

        throw new SuggestionServiceError("Failed to generate query embedding", 502, { cause: error });
      }
    } else {
      embedding = createMockEmbeddingVector(command.text, EMBEDDING_DIMENSION);
    }

    const limit = command.count ?? DEFAULT_SUGGESTION_COUNT;

    const { data, error } = await supabase.rpc(MATCH_FUNCTION_NAME, {
      [QUERY_EMBEDDING_PARAM]: embedding,
      [MATCH_COUNT_PARAM]: limit,
    });

    if (error) {
      throw new SuggestionServiceError("Failed to fetch hymn suggestions", 500, { cause: error });
    }

    const suggestions = (data ?? []).map(mapToSuggestionDto);
    const mode: SuggestionsMode = useAuthenticatedEmbedding ? "full" : "demo";

    return {
      data: suggestions,
      meta: { mode },
    } satisfies GenerateSuggestionsResponseDto;
  };

  return { generate };
};
