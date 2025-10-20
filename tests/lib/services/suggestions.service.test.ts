import type { SupabaseClient } from "../../../src/db/supabase.client.ts";
import type { GenerateSuggestionsCommand } from "../../../src/types";
import { EMBEDDING_DIMENSION } from "../../../src/lib/services/embedding.constants";
import { createSuggestionsService, SuggestionServiceError } from "../../../src/lib/services/suggestions.service";

const { generateEmbeddingsMock, MockEmbeddingServiceError } = vi.hoisted(() => {
  const generateEmbeddingsMock = vi.fn();

  class MockEmbeddingServiceError extends Error {
    status: number;
    constructor(message: string, status = 500, options?: { cause?: unknown }) {
      super(message);
      this.name = "EmbeddingServiceError";
      this.status = status;
      if (options?.cause) {
        (this as { cause?: unknown }).cause = options.cause;
      }
    }
  }

  return { generateEmbeddingsMock, MockEmbeddingServiceError };
});

vi.mock("../../../src/lib/services/embedding.service", () => ({
  embeddingService: {
    generateEmbeddings: generateEmbeddingsMock,
  },
  EmbeddingServiceError: MockEmbeddingServiceError,
}));

import { EmbeddingServiceError } from "../../../src/lib/services/embedding.service";

describe("createSuggestionsService", () => {
  const buildSupabase = () => {
    const rpc = vi.fn();
    return { supabase: { rpc } as unknown as SupabaseClient, rpc };
  };

  const createCommand = (overrides: Partial<GenerateSuggestionsCommand> = {}): GenerateSuggestionsCommand => ({
    text: "Give us hymns",
    ...overrides,
  });

  beforeEach(() => {
    generateEmbeddingsMock.mockReset();
  });

  it("falls back to mock embeddings when user is unauthenticated", async () => {
    const { supabase, rpc } = buildSupabase();
    rpc.mockResolvedValue({
      data: [{ number: "A1", name: "Gloria", category: "Opening" }],
      error: null,
    });
    const service = createSuggestionsService(supabase);

    const result = await service.generate(createCommand());

    expect(generateEmbeddingsMock).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith(
      "match_hymns",
      expect.objectContaining({
        match_count: 3,
      })
    );
    const params = rpc.mock.calls[0][1];
    expect(Array.isArray(params.query_embedding)).toBe(true);
    expect(params.query_embedding).toHaveLength(EMBEDDING_DIMENSION);
    expect(result).toEqual({
      data: [{ number: "A1", name: "Gloria", category: "Opening" }],
      meta: { mode: "demo" },
    });
  });

  it("generates embeddings for authenticated users", async () => {
    const { supabase, rpc } = buildSupabase();
    rpc.mockResolvedValue({
      data: [{ number: "A2", name: "Sanctus", category: "Communion" }],
      error: null,
    });
    generateEmbeddingsMock.mockResolvedValue([[0.1, 0.2, 0.3]]);
    const service = createSuggestionsService(supabase);

    const result = await service.generate(createCommand({ count: 5 }), { userId: "user-1" });

    expect(generateEmbeddingsMock).toHaveBeenCalledWith({
      content: "Give us hymns",
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: EMBEDDING_DIMENSION,
    });
    expect(rpc).toHaveBeenCalledWith(
      "match_hymns",
      expect.objectContaining({
        match_count: 5,
        query_embedding: [0.1, 0.2, 0.3],
      })
    );
    expect(result.meta.mode).toBe("full");
  });

  it("wraps embedding errors in SuggestionServiceError", async () => {
    const { supabase } = buildSupabase();
    generateEmbeddingsMock.mockRejectedValue(new EmbeddingServiceError("rate limited", 429));
    const service = createSuggestionsService(supabase);

    await expect(service.generate(createCommand(), { userId: "user-1" })).rejects.toBeInstanceOf(
      SuggestionServiceError
    );
  });

  it("translates Supabase failures into SuggestionServiceError", async () => {
    const { supabase, rpc } = buildSupabase();
    rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    const service = createSuggestionsService(supabase);

    await expect(service.generate(createCommand())).rejects.toMatchObject({
      message: "Failed to fetch hymn suggestions",
      status: 500,
    });
  });
});
