import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  BatchEmbedContentsResponse,
  EmbedContentRequest,
  TaskType as GeminiTaskType,
} from "@google/generative-ai";
import { z } from "zod";

import { EMBEDDING_TASK_TYPES } from "../../types";
import type { EmbeddingParams, TaskType } from "../../types";

const EMBEDDING_MODEL_NAME = "gemini-embedding-001";
const MAX_BATCH_SIZE = 16;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 250;
const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set(["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"]);

type EmbeddingModel = ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;

export const embeddingParamsSchema = z
  .object({
    content: z.union([
      z.string().min(1, "content must not be empty"),
      z
        .array(z.string().min(1, "content entries must not be empty"))
        .min(1, "content array must include at least one item"),
    ]),
    taskType: z.enum(EMBEDDING_TASK_TYPES).optional(),
    title: z.string().min(1, "title must not be empty").optional(),
    outputDimensionality: z
      .number()
      .int("outputDimensionality must be an integer")
      .positive("outputDimensionality must be positive")
      .max(768, "outputDimensionality exceeds model capabilities")
      .optional(),
  })
  .strict();

/**
 * Custom error class for handling errors within the EmbeddingService.
 * Allows for specifying an HTTP status code to facilitate error handling in an API context.
 */
export class EmbeddingServiceError extends Error {
  readonly status: number;
  override readonly cause?: unknown;

  /**
   * Creates an instance of EmbeddingServiceError.
   * @param message - The error message.
   * @param status - The HTTP status code associated with the error. Defaults to 500.
   * @param options - Optional parameters, including the original error cause.
   */
  constructor(message: string, status = 500, options?: { cause?: unknown }) {
    super(message);
    this.name = "EmbeddingServiceError";
    this.status = status;
    this.cause = options?.cause;
  }
}

/**
 * Service for generating content embeddings using the Google Generative AI API.
 * It handles batching, retries, and error management for embedding generation.
 *
 * @requires GOOGLE_API_KEY - This service requires the `GOOGLE_API_KEY` environment variable to be set.
 */
export class EmbeddingService {
  private readonly generativeAI: GoogleGenerativeAI;
  private readonly model: EmbeddingModel;

  /**
   * Initializes the EmbeddingService.
   * @param apiKey - The Google API key. Defaults to `import.meta.env.GOOGLE_API_KEY`.
   * @throws {EmbeddingServiceError} If the API key is not provided.
   */
  constructor(apiKey = import.meta.env.GOOGLE_API_KEY) {
    if (!apiKey) {
      throw new EmbeddingServiceError("Missing GOOGLE_API_KEY environment variable", 500);
    }

    this.generativeAI = new GoogleGenerativeAI(apiKey);
    this.model = this.generativeAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });
  }

  /**
   * Generates embeddings for the given content.
   * The method validates input, handles batching of requests, and applies a retry mechanism for transient errors.
   *
   * @param params - The parameters for generating embeddings, validated against `embeddingParamsSchema`.
   * @returns A promise that resolves to an array of embedding vectors (number[][]).
   * @throws {EmbeddingServiceError} If embedding generation fails after multiple retries, or if the input is invalid.
   * @throws {z.ZodError} If the `params` object does not match the `embeddingParamsSchema`.
   */
  async generateEmbeddings(params: EmbeddingParams): Promise<number[][]> {
    const validated = embeddingParamsSchema.parse(params);
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

  /**
   * Builds a single embedding request object.
   * @private
   * @param text - The text content to embed.
   * @param taskType - The type of task for the embedding model.
   * @param title - An optional title for the content.
   * @returns An `EmbedContentRequest` object.
   */
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

  /**
   * Maps the API response to an array of embedding vectors and trims them if necessary.
   * @private
   * @param response - The response from the `batchEmbedContents` API call.
   * @param outputDimensionality - The desired dimensionality of the output vectors.
   * @returns An array of embedding vectors.
   * @throws {EmbeddingServiceError} If the response contains no embeddings.
   */
  private mapResponse(response: BatchEmbedContentsResponse, outputDimensionality?: number): number[][] {
    const embeddings = response.embeddings ?? [];

    if (!embeddings.length) {
      throw new EmbeddingServiceError("Embedding response did not contain any vectors", 502);
    }

    return embeddings.map((entry) => this.trimVector(entry.values, outputDimensionality));
  }

  /**
   * Trims an embedding vector to a specified dimensionality.
   * @private
   * @param values - The original embedding vector.
   * @param outputDimensionality - The target dimensionality.
   * @returns The trimmed embedding vector.
   * @throws {EmbeddingServiceError} If the vector is empty or if the requested dimensionality is invalid.
   */
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

  /**
   * Splits an array into smaller chunks of a specified size.
   * @private
   * @template T - The type of items in the array.
   * @param items - The array to chunk.
   * @param size - The maximum size of each chunk.
   * @returns An array of chunks.
   */
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

  /**
   * Wraps an operation with a retry mechanism that includes exponential backoff.
   * @private
   * @param operation - The asynchronous operation to perform.
   * @param attempt - The current attempt number.
   * @returns A promise that resolves with the operation's result.
   * @throws {EmbeddingServiceError} If the operation fails after all retry attempts.
   */
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

  /**
   * Determines if an error is retryable based on its status code or error code.
   * @private
   * @param error - The error to check.
   * @returns `true` if the error is retryable, otherwise `false`.
   */
  private isRetryable(error: unknown): boolean {
    const status = this.extractStatus(error);

    if (status && RETRYABLE_STATUS_CODES.has(status)) {
      return true;
    }

    const code = this.extractErrorCode(error);
    return Boolean(code && RETRYABLE_ERROR_CODES.has(code));
  }

  /**
   * Extracts the HTTP status code from a variety of possible error structures.
   * @private
   * @param error - The error object.
   * @returns The status code, or `undefined` if not found.
   */
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

  /**
   * Extracts the error code (e.g., 'ECONNRESET') from an error object.
   * @private
   * @param error - The error object.
   * @returns The error code string, or `undefined` if not found.
   */
  private extractErrorCode(error: unknown): string | undefined {
    if (typeof error !== "object" || error === null) {
      return undefined;
    }

    if ("code" in error && typeof (error as { code?: unknown }).code === "string") {
      return (error as { code: string }).code;
    }

    return undefined;
  }

  /**
   * Creates a delay for a specified number of milliseconds.
   * @private
   * @param milliseconds - The duration of the delay.
   * @returns A promise that resolves after the delay.
   */
  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}

export const embeddingService = new EmbeddingService();
