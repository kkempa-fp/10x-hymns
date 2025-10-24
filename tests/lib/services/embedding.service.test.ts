const { batchEmbedContentsMock, getGenerativeModelMock, googleClientMock } = vi.hoisted(() => {
  vi.stubEnv("GOOGLE_API_KEY", "test-key");

  const batchEmbedContentsMock = vi.fn();
  const getGenerativeModelMock = vi.fn(function () {
    return { batchEmbedContents: batchEmbedContentsMock };
  });
  const googleClientMock = vi.fn(function () {
    return { getGenerativeModel: getGenerativeModelMock };
  });

  return {
    batchEmbedContentsMock,
    getGenerativeModelMock,
    googleClientMock,
  };
});

vi.mock("@google/generative-ai", () => ({
  __esModule: true,
  GoogleGenerativeAI: googleClientMock,
}));

import {
  EmbeddingService,
  EmbeddingServiceError,
  embeddingParamsSchema,
} from "../../../src/lib/services/embedding.service";

describe("EmbeddingService", () => {
  beforeEach(() => {
    batchEmbedContentsMock.mockReset();
    getGenerativeModelMock.mockReset();
    googleClientMock.mockReset();
    getGenerativeModelMock.mockImplementation(function () {
      return { batchEmbedContents: batchEmbedContentsMock };
    });
    googleClientMock.mockImplementation(function () {
      return { getGenerativeModel: getGenerativeModelMock };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("validates parameters using embeddingParamsSchema", () => {
    expect(() => embeddingParamsSchema.parse({ content: "" })).toThrow();
    expect(() => embeddingParamsSchema.parse({ content: [""] })).toThrow();
    expect(() => embeddingParamsSchema.parse({ content: "text" })).not.toThrow();
  });

  it("throws when instantiated without an API key", () => {
    expect(() => new EmbeddingService("")).toThrowError(
      new EmbeddingServiceError("Missing GOOGLE_API_KEY environment variable", 500)
    );
  });

  it("builds requests and maps trimmed embeddings", async () => {
    batchEmbedContentsMock.mockResolvedValue({ embeddings: [{ values: [1, 2, 3] }] });

    const service = new EmbeddingService("key");
    const result = await service.generateEmbeddings({ content: "text", outputDimensionality: 2 });

    expect(batchEmbedContentsMock).toHaveBeenCalledWith({
      requests: [
        expect.objectContaining({
          content: {
            role: "user",
            parts: [{ text: "text" }],
          },
        }),
      ],
    });
    expect(result).toEqual([[1, 2]]);
  });

  it("retries transient failures before succeeding", async () => {
    batchEmbedContentsMock.mockRejectedValueOnce({ status: 503 });
    batchEmbedContentsMock.mockResolvedValueOnce({ embeddings: [{ values: [0.5] }] });

    const service = new EmbeddingService("key");

    vi.useFakeTimers();
    const promise = service.generateEmbeddings({ content: "retry" });

    await vi.runOnlyPendingTimersAsync();
    const result = await promise;

    expect(result).toEqual([[0.5]]);
    expect(batchEmbedContentsMock).toHaveBeenCalledTimes(2);
  });

  it("throws when the API response does not contain embeddings", async () => {
    batchEmbedContentsMock.mockResolvedValue({ embeddings: [] });

    const service = new EmbeddingService("key");

    await expect(service.generateEmbeddings({ content: "missing" })).rejects.toMatchObject({
      message: "Embedding response did not contain any vectors",
      status: 502,
    });
  });
});
