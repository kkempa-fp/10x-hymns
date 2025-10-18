import type { APIRoute } from "astro";
import { z } from "zod";

import { createRatingsService, RatingServiceError } from "../../lib/services/ratings.service.ts";
import type { SubmitRatingCommand } from "../../types";

const submitRatingSchema = z.object({
  proposed_hymn_numbers: z.array(z.union([z.string(), z.number()])).min(1, "At least one hymn number is required"),
  rating: z.enum(["up", "down"], { invalid_type_error: "Rating must be 'up' or 'down'" }),
  client_fingerprint: z.string().trim().min(1, "Client fingerprint is required"),
});

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  if (!supabase) {
    return jsonResponse({ error: "Supabase client not configured" }, 500);
  }

  let command: SubmitRatingCommand;
  let userId: string | null = null;

  try {
    const payload = await request.json();
    const parsed = submitRatingSchema.parse(payload);
    command = {
      client_fingerprint: parsed.client_fingerprint,
      rating: parsed.rating,
      proposed_hymn_numbers: parsed.proposed_hymn_numbers.map((value) => value.toString().trim()),
    } satisfies SubmitRatingCommand;
  } catch (parseError) {
    if (parseError instanceof SyntaxError) {
      return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    if (parseError instanceof z.ZodError) {
      return jsonResponse({ errors: parseError.format() }, 400);
    }

    return jsonResponse({ error: "Failed to process request" }, 500);
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) {
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError) {
        return jsonResponse({ error: "Invalid authentication token" }, 401);
      }

      userId = userData.user?.id ?? null;
    }
  }

  const ratingsService = createRatingsService(supabase);

  try {
    const response = await ratingsService.submit(command, userId);
    return jsonResponse(response, 201);
  } catch (unknownError) {
    if (unknownError instanceof RatingServiceError) {
      return jsonResponse({ error: unknownError.message }, unknownError.status);
    }

    return jsonResponse({ error: "Failed to submit rating" }, 500);
  }
};
