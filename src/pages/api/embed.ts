import type { APIRoute } from "astro";

import { embeddingService, EmbeddingServiceError } from "../../lib/services/embedding.service";
import { EmbeddingParamsSchema } from "../../types";

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  const parseResult = EmbeddingParamsSchema.safeParse(payload);

  if (!parseResult.success) {
    return jsonResponse({ errors: parseResult.error.format() }, 400);
  }

  try {
    const embeddings = await embeddingService.generateEmbeddings(parseResult.data);
    return jsonResponse({ data: embeddings }, 200);
  } catch (error) {
    if (error instanceof EmbeddingServiceError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    return jsonResponse({ error: "Failed to generate embeddings" }, 500);
  }
};
