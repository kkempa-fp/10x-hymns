import type { APIRoute } from "astro";
import { z } from "zod";

import { createSetsService, SetServiceError } from "../../lib/services/sets.service.ts";
import type { CreateSetCommand } from "../../types";
import { DEFAULT_USER_ID } from "../../db/supabase.client.ts";

const MAX_FIELD_LENGTH = 200;

const createSetSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be a string" })
    .trim()
    .min(1, "Name is required")
    .max(MAX_FIELD_LENGTH, "Name cannot exceed 200 characters"),
  content: z
    .string({ invalid_type_error: "Content must be a string" })
    .trim()
    .max(2000, "Content cannot exceed 2000 characters")
    .optional()
    .default(""),
});

const listSetsSchema = z.object({
  search: z.string().trim().min(1).max(MAX_FIELD_LENGTH).optional(),
  page: z.coerce
    .number({ invalid_type_error: "Page must be a number" })
    .int("Page must be an integer")
    .positive("Page must be positive")
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: "Limit must be a number" })
    .int("Limit must be an integer")
    .positive("Limit must be positive")
    .max(50, "Limit cannot exceed 50")
    .default(10),
  sort: z.enum(["name", "created_at", "updated_at"]).default("updated_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  if (!supabase) {
    return jsonResponse({ error: "Supabase client not configured" }, 500);
  }

  let queryParams: z.infer<typeof listSetsSchema>;

  try {
    const url = new URL(request.url);
    const raw = Object.fromEntries(url.searchParams.entries());
    queryParams = listSetsSchema.parse(raw);
  } catch (parseError) {
    if (parseError instanceof z.ZodError) {
      return jsonResponse({ errors: parseError.format() }, 400);
    }

    return jsonResponse({ error: "Failed to process request" }, 500);
  }

  const setsService = createSetsService(supabase);

  try {
    const response = await setsService.list(DEFAULT_USER_ID, queryParams);
    return jsonResponse(response, 200);
  } catch (unknownError) {
    if (unknownError instanceof SetServiceError) {
      return jsonResponse({ error: unknownError.message }, unknownError.status);
    }

    return jsonResponse({ error: "Failed to fetch sets" }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  let command: CreateSetCommand;

  try {
    const payload = await request.json();
    const parsed: CreateSetCommand = createSetSchema.parse(payload);
    command = {
      name: parsed.name,
      content: parsed.content,
    };
  } catch (parseError) {
    if (parseError instanceof SyntaxError) {
      return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    if (parseError instanceof z.ZodError) {
      return jsonResponse({ errors: parseError.format() }, 400);
    }

    return jsonResponse({ error: "Failed to process request" }, 500);
  }

  const supabase = locals.supabase;

  if (!supabase) {
    return jsonResponse({ error: "Supabase client not configured" }, 500);
  }

  const setsService = createSetsService(supabase);

  try {
    const response = await setsService.create(DEFAULT_USER_ID, command);
    return jsonResponse(response, 201);
  } catch (unknownError) {
    if (unknownError instanceof SetServiceError) {
      if (unknownError.status >= 500 && unknownError.cause) {
        return jsonResponse(
          { error: unknownError.message, details: "Unexpected failure while creating set" },
          unknownError.status
        );
      }

      return jsonResponse({ error: unknownError.message }, unknownError.status);
    }

    return jsonResponse({ error: "Failed to create set" }, 500);
  }
};
