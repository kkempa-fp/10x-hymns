import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  BatchEmbedContentsResponse,
  EmbedContentRequest,
  TaskType as GeminiTaskType,
} from "@google/generative-ai";
import { EmbeddingParamsSchema } from "../../types";
import type { EmbeddingParams, TaskType } from "../../types";

const EMBEDDING_MODEL_NAME = "gemini-embedding-001";
const MAX_BATCH_SIZE = 16;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 250;
const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set(["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"]);

type EmbeddingModel = ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;

export class EmbeddingServiceError extends Error {
  readonly status: number;
  override readonly cause?: unknown;

  constructor(message: string, status = 500, options?: { cause?: unknown }) {
    super(message);
    this.name = "EmbeddingServiceError";
    this.status = status;
    this.cause = options?.cause;
  }
}

export class EmbeddingService {
  private readonly generativeAI: GoogleGenerativeAI;
  private readonly model: EmbeddingModel;

  constructor(apiKey = import.meta.env.GOOGLE_API_KEY) {
    if (!apiKey) {
      throw new EmbeddingServiceError("Missing GOOGLE_API_KEY environment variable", 500);
    }

    this.generativeAI = new GoogleGenerativeAI(apiKey);
    this.model = this.generativeAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });
  }

  async generateEmbeddings(params: EmbeddingParams): Promise<number[][]> {
    const validated = EmbeddingParamsSchema.parse(params);
    const inputs = Array.isArray(validated.content) ? validated.content : [validated.content];

    if (!inputs.length) {
      return [];
    }

    const requests = inputs.map((text) => this.buildRequest(text, validated.taskType, validated.title));
    const vectors: number[][] = [];

    for (const chunk of this.chunkRequests(requests, MAX_BATCH_SIZE)) {
      const response = await this.withRetry(() => this.model.batchEmbedContents({ requests: chunk }));
      vectors.push(...this.mapResponse(response, validated.outputDimensionality));
    }

    if (vectors.length !== inputs.length) {
      throw new EmbeddingServiceError("Embedding count mismatch", 502);
    }

    return vectors;
  }

  private buildRequest(text: string, taskType?: TaskType, title?: string): EmbedContentRequest {
    const request: EmbedContentRequest = {
      content: {
        role: "user",
        parts: [{ text }],
      },
    };

    if (taskType) {
      request.taskType = taskType as GeminiTaskType;
    }

    if (title) {
      request.title = title;
    }

    return request;
  }

  private mapResponse(response: BatchEmbedContentsResponse, outputDimensionality?: number): number[][] {
    const embeddings = response.embeddings ?? [];

    if (!embeddings.length) {
      throw new EmbeddingServiceError("Embedding response did not contain any vectors", 502);
    }

    return embeddings.map((entry) => this.trimVector(entry.values, outputDimensionality));
  }

  private trimVector(values: number[], outputDimensionality?: number): number[] {
    if (!Array.isArray(values) || values.length === 0) {
      throw new EmbeddingServiceError("Embedding vector was empty", 502);
    }

    if (!outputDimensionality) {
      return values;
    }

    if (outputDimensionality > values.length) {
      throw new EmbeddingServiceError("Requested dimensionality exceeds returned vector size", 400);
    }

    return values.slice(0, outputDimensionality);
  }

  private chunkRequests<T>(items: T[], size: number): T[][] {
    if (size <= 0) {
      return [items];
    }

    const chunks: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }

    return chunks;
  }

  private async withRetry(
    operation: () => Promise<BatchEmbedContentsResponse>,
    attempt = 1
  ): Promise<BatchEmbedContentsResponse> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS || !this.isRetryable(error)) {
        throw new EmbeddingServiceError("Failed to generate embeddings", 502, { cause: error });
      }

      await this.delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      return this.withRetry(operation, attempt + 1);
    }
  }

  private isRetryable(error: unknown): boolean {
    const status = this.extractStatus(error);

    if (status && RETRYABLE_STATUS_CODES.has(status)) {
      return true;
    }

    const code = this.extractErrorCode(error);
    return Boolean(code && RETRYABLE_ERROR_CODES.has(code));
  }

  private extractStatus(error: unknown): number | undefined {
    if (typeof error !== "object" || error === null) {
      return undefined;
    }

    if ("status" in error && typeof (error as { status?: unknown }).status === "number") {
      return (error as { status: number }).status;
    }

    if ("statusCode" in error && typeof (error as { statusCode?: unknown }).statusCode === "number") {
      return (error as { statusCode: number }).statusCode;
    }

    if (
      "response" in error &&
      typeof (error as { response?: unknown }).response === "object" &&
      (error as { response?: { status?: number } }).response?.status
    ) {
      return (error as { response: { status: number } }).response.status;
    }

    return undefined;
  }

  private extractErrorCode(error: unknown): string | undefined {
    if (typeof error !== "object" || error === null) {
      return undefined;
    }

    if ("code" in error && typeof (error as { code?: unknown }).code === "string") {
      return (error as { code: string }).code;
    }

    return undefined;
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}

export const embeddingService = new EmbeddingService();
