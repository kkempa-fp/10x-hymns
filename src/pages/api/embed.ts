import type { APIRoute } from "astro";

import { embeddingParamsSchema, embeddingService, EmbeddingServiceError } from "../../lib/services/embedding.service";
import { createMockEmbeddings } from "../../lib/services/mock-embedding";

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  const parseResult = embeddingParamsSchema.safeParse(payload);

  if (!parseResult.success) {
    return jsonResponse({ errors: parseResult.error.format() }, 400);
  }

  const isAuthenticated = Boolean(locals.user?.id);

  if (!isAuthenticated) {
    const demoVectors = createMockEmbeddings(parseResult.data.content);
    return jsonResponse({ data: demoVectors, meta: { mode: "demo" } }, 200);
  }

  try {
    const embeddings = await embeddingService.generateEmbeddings(parseResult.data);
    return jsonResponse({ data: embeddings, meta: { mode: "full" } }, 200);
  } catch (error) {
    if (error instanceof EmbeddingServiceError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    return jsonResponse({ error: "Failed to generate embeddings" }, 500);
  }
};
