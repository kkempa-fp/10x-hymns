import type { SupabaseClient } from "../../db/supabase.client.ts";
import type { GenerateSuggestionsCommand, GenerateSuggestionsResponseDto, SuggestionDto } from "../../types";

const EMBEDDING_DIMENSION = 768;
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

const createDeterministicRng = (seed: number) => {
  let state = seed || 1;
  return () => {
    state = (1664525 * state + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };
};

const mockGenerateEmbedding = (text: string): number[] => {
  const seed = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = createDeterministicRng(seed);

  return Array.from({ length: EMBEDDING_DIMENSION }, () => random() * 2 - 1);
};

const mapToSuggestionDto = (row: MatchHymnsRow): SuggestionDto => ({
  number: row.number,
  name: row.name,
  category: row.category,
});

export const createSuggestionsService = (supabase: SupabaseClient) => {
  const generate = async (command: GenerateSuggestionsCommand): Promise<GenerateSuggestionsResponseDto> => {
    const embedding = mockGenerateEmbedding(command.text);
    const limit = command.count ?? DEFAULT_SUGGESTION_COUNT;

    const { data, error } = await supabase.rpc(MATCH_FUNCTION_NAME, {
      [QUERY_EMBEDDING_PARAM]: embedding,
      [MATCH_COUNT_PARAM]: limit,
    });

    if (error) {
      throw new SuggestionServiceError("Failed to fetch hymn suggestions", 500, { cause: error });
    }

    const suggestions = (data ?? []).map(mapToSuggestionDto);

    return { data: suggestions } satisfies GenerateSuggestionsResponseDto;
  };

  return { generate };
};
