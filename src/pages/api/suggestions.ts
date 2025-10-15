import type { APIRoute } from "astro";
import { z } from "zod";

import { createSuggestionsService, SuggestionServiceError } from "../../lib/services/suggestions.service";
import type { GenerateSuggestionsCommand } from "../../types";

const generateSuggestionsSchema = z.object({
  text: z.string().min(1, "Text must be non-empty"),
  count: z
    .number({ invalid_type_error: "Count must be a number" })
    .int("Count must be an integer")
    .positive("Count must be positive")
    .max(10, "Count cannot exceed 10")
    .optional()
    .default(3),
});

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  let command: GenerateSuggestionsCommand;

  try {
    const payload = await request.json();
    const parsed = generateSuggestionsSchema.parse(payload);
    command = { text: parsed.text, count: parsed.count };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    if (error instanceof z.ZodError) {
      return jsonResponse({ errors: error.format() }, 400);
    }

    return jsonResponse({ error: "Failed to process request" }, 500);
  }

  const supabase = locals.supabase;

  if (!supabase) {
    return jsonResponse({ error: "Supabase client not configured" }, 500);
  }

  const service = createSuggestionsService(supabase);

  try {
    const response = await service.generate(command);
    return jsonResponse(response, 200);
  } catch (error) {
    if (error instanceof SuggestionServiceError) {
      if (error.cause) {
        return jsonResponse({ error: error.message, details: "Upstream service error" }, error.status);
      }
      return jsonResponse({ error: error.message }, error.status);
    }

    return jsonResponse({ error: "Failed to generate suggestions" }, 500);
  }
};
